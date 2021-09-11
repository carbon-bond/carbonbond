import * as React from 'react';

import { API_FETCHER, unwrap_or } from '../../ts/api/api';
import { UserState } from '../global_state/user';
import { Draft } from '../../ts/api/api_trait';

import style from '../../css/left_panel/draft_bar.module.css';


export function DraftBar(): JSX.Element {
	const drafts: Draft[] = [
		{title: '金庸最經典的是哪一部？'},
		{title: '微服務架構模式'},
		{title: 'k8s 要一統江湖了嗎？'},
	];
	return <div className={style.draftBar}>
		{
			drafts.map(draft => {
				return <div className={style.draft} key={draft.title}>{draft.title}</div>;
			})
		}
	</div>;
}