import { API_FETCHER, unwrap_or } from 'carbonbond-api/api_utils';
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useDebounce } from 'react-use';
import { Editor, Transforms, Range, createEditor, Descendant, BaseEditor } from 'slate';
import { HistoryEditor, withHistory } from 'slate-history';
import {
	Slate,
	Editable,
	ReactEditor,
	withReact,
	RenderElementProps,
	RenderLeafProps,
} from 'slate-react';
import style from '../../css/components/comment_editor.module.css';

type PortalProps = { children: React.ReactNode };

export const Portal = ({ children }: PortalProps): React.ReactPortal | null => {
	return typeof document === 'object'
		? ReactDOM.createPortal(children, document.body)
		: null;
};

type CustomText = {
	text: string
};

type MentionElement = {
	kind: 'Mention'
	account: string
	children: CustomText[]
};

type ParagraphElement = {
	kind: 'Paragraph'
	children: (CustomText | MentionElement)[]
};

type CustomElement = MentionElement | ParagraphElement;
export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module 'slate' {
	interface CustomTypes {
		Editor: CustomEditor
		Element: CustomElement
		Text: CustomText
	}
}

type EditorProps = {
	setValue: (value: Descendant[]) => void
	setEditor: (editor: CustomEditor) => void
};

const CANDIDATES_COUNT = 5;

async function lookupAccount(prefix: string): Promise<string[]> {
	return API_FETCHER.userQuery.searchUserNameByPrefix(prefix, CANDIDATES_COUNT)
		.then(candidates => unwrap_or(candidates, []));
}

export const CommentEditor = (props: EditorProps): JSX.Element => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [target, setTarget] = useState<Range | null>();
	const [index, setIndex] = useState(0);
	const [prefix, setPrefix] = useState('');
	const renderElement = useCallback(props => <Element {...props} />, []);
	const renderLeaf = useCallback(props => <Leaf {...props} />, []);
	const editor = useMemo(
		() => withMentions(withReact(withHistory(createEditor()))),
		[]
	);
	const [candidates, setCandidates] = useState<string[]>([]);

	// 爲了節流，用戶停止輸入 500 毫秒後，才向伺服器發出請求。
	useDebounce(() => {
		lookupAccount(prefix).then(results => {
			setCandidates(results);
		});
	}, 500, [prefix]);

	const onKeyDown = useCallback(
		event => {
			if (target && candidates.length > 0) {
				switch (event.key) {
					case 'ArrowDown':
						event.preventDefault();
						const prevIndex = index >= candidates.length - 1 ? 0 : index + 1;
						setIndex(prevIndex);
						break;
					case 'ArrowUp':
						event.preventDefault();
						const nextIndex = index <= 0 ? candidates.length - 1 : index - 1;
						setIndex(nextIndex);
						break;
					case 'Tab':
					case 'Enter':
						event.preventDefault();
						Transforms.select(editor, target);
						insertMention(editor, candidates[index]);
						setTarget(null);
						break;
					case 'Escape':
						event.preventDefault();
						setTarget(null);
						break;
				}
			}
		},
		[candidates, editor, index, target]
	);

	useEffect(() => {
		props.setEditor(editor);
		if (target && candidates.length > 0) {
			const el = ref.current;
			if (el) {
				const domRange = ReactEditor.toDOMRange(editor, target);
				const rect = domRange.getBoundingClientRect();
				el.style.top = `${rect.top + window.pageYOffset + 24}px`;
				el.style.left = `${rect.left + window.pageXOffset}px`;
			}
		}
	}, [candidates.length, editor, index, prefix, props, target]);

	return (
		<Slate
			editor={editor}
			value={initialValue}
			onChange={value => {
				const { selection } = editor;

				if (selection && Range.isCollapsed(selection)) {
					const [start] = Range.edges(selection);
					const wordBefore = Editor.before(editor, start, { unit: 'word' });
					const before = wordBefore && Editor.before(editor, wordBefore);
					const beforeRange = before && Editor.range(editor, before, start);
					const beforeText = beforeRange && Editor.string(editor, beforeRange);
					const beforeMatch = beforeText && beforeText.match(/^@(\S+)$/);
					const after = Editor.after(editor, start);
					const afterRange = Editor.range(editor, start, after);
					const afterText = Editor.string(editor, afterRange);
					const afterMatch = afterText.match(/^(\s|$)/);

					if (beforeMatch && afterMatch) {
						setTarget(beforeRange);
						setPrefix(beforeMatch[1]);
						setIndex(0);
						return;
					}
				}
				props.setValue(value);
				setTarget(null);
			}}
		>
			<Editable
				className={style.editor}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onKeyDown={onKeyDown}
				autoFocus={true}
				placeholder="我來留言"
			/>
			{target && candidates.length > 0 && (
				<Portal>
					<div
						ref={ref}
						style={{
							top: '-9999px',
							left: '-9999px',
							position: 'absolute',
							zIndex: 1,
							padding: '3px',
							background: 'white',
							borderRadius: '4px',
							boxShadow: '0 1px 5px rgba(0,0,0,.2)',
						}}
						data-cy="mentions-portal"
					>
						{candidates.map((char, i) => (
							<div
								key={char}
								style={{
									padding: '1px 3px',
									borderRadius: '3px',
									background: i === index ? '#B4D5FF' : 'transparent',
								}}
							>
								{char}
							</div>
						))}
					</div>
				</Portal>
			)}
		</Slate>
	);
};

const withMentions = (editor: Editor): Editor => {
	const { isInline, isVoid, markableVoid } = editor;

	editor.isInline = element => {
		return element.kind === 'Mention' ? true : isInline(element);
	};

	editor.isVoid = element => {
		return element.kind === 'Mention' ? true : isVoid(element);
	};

	editor.markableVoid = element => {
		return element.kind === 'Mention' || markableVoid(element);
	};

	return editor;
};

const insertMention = (editor: Editor, account: string): void => {
	const mention: MentionElement = {
		kind: 'Mention',
		account: account,
		children: [{ text: '' }], // TODO: children 爲空的話 slate 會報錯
	};
	Transforms.insertNodes(editor, mention);
	Transforms.move(editor);
};

// 目前不支援富文本，leaf 是純文字，不需要任何處理
const Leaf = ({ attributes, children }: RenderLeafProps): JSX.Element => {
	return <span {...attributes}>{children}</span>;
};

const Element = (props: RenderElementProps): JSX.Element => {
	const { attributes, children, element } = props;
	switch (element.kind) {
		case 'Mention':
			return <Mention {...props} />;
		default:
			return <p {...attributes}>{children}</p>;
	}
};

const Mention = ({ attributes, children, element }: RenderElementProps): JSX.Element => {
	if (element.kind != 'Mention') {
		throw new Error('並非 mention');
	}
	return (
		<span
			{...attributes}
			contentEditable={false}
			data-cy={`mention-${element.account.replace(' ', '-')}`}
			className={style.mention}
		>
			{children}@{element.account}
		</span>
	);
};

const initialValue: Descendant[] = [
	{
		kind: 'Paragraph',
		children: [
			{
				text: '',
			},
		],
	},
];

export function ShowComment(props: { text: Descendant[]; }): JSX.Element {
	return <div>
		{
			props.text.map((descendant, index)=> {
				if ('kind' in descendant) {
					switch (descendant.kind) {
						case 'Paragraph':
							return <div key={index}><ShowComment text={descendant.children} /></div>;
						case 'Mention':
							return <span key={index} className={style.mention}>@{descendant.account}</span>;
					}
				} else {
					return <span key={index}>{descendant.text}</span>;
				}
			})
		}
	</div>;
}
