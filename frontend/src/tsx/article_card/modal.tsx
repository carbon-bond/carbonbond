import * as React from 'react';
import ReactModal from 'react-modal';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleMeta, Board } from '../../ts/api/api_trait';
import { toastErr } from '../utils';
import { BonderCards, ReplyButtons } from './bonder';

export function Modal<T>(props: { close: () => void, children: T }): JSX.Element {
	ReactModal.setAppElement('body');
	return <ReactModal
		isOpen={true}
		onRequestClose={() => props.close()}
		// className={'ModalWindow--Content'}
		style={{
			overlay: { zIndex: 200 },
			content: {
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				right: 'none',
				bottom: 'none',
				padding: '2px'
			}
		}} >
		{props.children}
	</ReactModal>;
}
export function ReplyModal(props: { article: ArticleMeta, close: () => void }): JSX.Element {
	let board = useBoard(props.article.board_id);
	if (!board) {
		return <></>;
	}
	return <Modal close={props.close}>
		<ReplyButtons article={props.article} board={board} />
		<BonderCards expanded={true} article={props.article} />
	</Modal>;
}

function useBoard(board_id: number): Board | null {
	// TODO: 記憶
	const [board, setBoard] = React.useState<Board | null>(null);
	React.useEffect(() => {
		API_FETCHER.boardQuery.queryBoardById(board_id).then(res => {
			setBoard(unwrap(res));
		}).catch(err => {
			toastErr(err);
		});
	}, [board_id]);
	return board;
}