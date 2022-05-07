import * as React from 'react';

import { API_FETCHER, unwrap, unwrap_or } from '../../ts/api/api';
import { DraftState } from '../global_state/draft';
import { Draft } from '../../ts/api/api_trait';
import { roughDate } from '../../ts/date';

import style from '../../css/left_panel/draft_bar.module.css';
import { EditorPanelState } from '../global_state/editor_panel';
import { toastErr } from '../utils';

function DraftTitle(props: {title: string}): JSX.Element {
	return <div className={style.title}>
		{
			props.title === '' ?
				<span className={style.noTitle}>*無標題*</span> :
				<>{props.title}</>
		}
	</div>;
}

function DraftCard(props: {draft: Draft}): JSX.Element {
	const { setEditorPanelData, expandEditorPanel } = EditorPanelState.useContainer();
	const [ is_hover, setHover ] = React.useState<Boolean>(false);
	const { setDraftData } = DraftState.useContainer();

	return <div
		className={style.draft}
		onMouseEnter={() => setHover(true)}
		onMouseLeave={() => setHover(false)}
		onClick={() => {
			API_FETCHER.boardQuery.queryBoardById(props.draft.board_id)
				.then(data => unwrap(data))
				.then(board => {
					setEditorPanelData({
						draft_id: props.draft.id,
						board: board,
						anonymous: props.draft.anonymous,
						title: props.draft.title,
						category_name: props.draft.category ?? '',
						value: {
							content: JSON.parse(props.draft.content),
							fields: props.draft.fields
						},
						bonds: JSON.parse(props.draft.bonds),
					});
					expandEditorPanel();
				})
				.catch(err => console.error(err));
		}}>
		<div className={style.info}>
			<DraftTitle title={props.draft.title} />
			<div className={style.meta}>
				{props.draft.board_name} • {roughDate(new Date(props.draft.create_time))}
			</div>
		</div>
		{
			is_hover ?
				<div className={style.buttons}>
					<button
						className={style.delete}
						onClick={(evt) => {
							evt.stopPropagation();
							API_FETCHER.articleQuery.deleteDraft(props.draft.id)
							.then(() => {
								// TODO: 考慮不重新獲取所有草稿
								return API_FETCHER.articleQuery.queryDraft();
							})
							.then(res => unwrap(res))
							.then(drafts => setDraftData(drafts))
							.catch(err => toastErr(err));
						}}>
						🗑️
					</button>
				</div> :
				<></>
		}
	</div>;
}


export function DraftBar(): JSX.Element {
	const { setDraftData, draft_data } = DraftState.useContainer();
	React.useEffect(() => {
		API_FETCHER.articleQuery.queryDraft().then(drafts => {
			setDraftData(unwrap_or(drafts, []));
		});
	}, [setDraftData]);
	return <div className={style.draftBar}>
		<div className={style.barName}>草稿匣</div>
		{
			draft_data.map(draft => <div key={draft.title}><DraftCard draft={draft} /></div>)
		}
	</div>;
}