import * as React from 'react';

import { API_FETCHER, unwrap, unwrap_or } from '../../ts/api/api';
import { DraftState } from '../global_state/draft';
import { Draft } from '../../ts/api/api_trait';
import { roughDate } from '../../ts/date';

import style from '../../css/left_panel/draft_bar.module.css';
import { EditorPanelState } from '../global_state/editor_panel';

function DraftCard(props: {draft: Draft}): JSX.Element {
	const { setEditorPanelData, expandEditorPanel } = EditorPanelState.useContainer();

	return <div
		className={style.draft}
		onClick={() => {
			API_FETCHER.boardQuery.queryBoardById(props.draft.board_id)
				.then(data => unwrap(data))
				.then(board => {
					setEditorPanelData({
						draft_id: props.draft.id,
						board: board,
						title: props.draft.title,
						category: props.draft.category_name ?? '',
						content: JSON.parse(props.draft.content)
					});
					expandEditorPanel();
				})
				.catch(err => console.error(err));
		}}>
		<div className={style.title}>
			{props.draft.title}
		</div>
		<div className={style.meta}>
			{props.draft.board_name} • {roughDate(new Date(props.draft.create_time))}
		</div>
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
		{
			draft_data.map(draft => <div key={draft.title}><DraftCard draft={draft} /></div>)
		}
	</div>;
}