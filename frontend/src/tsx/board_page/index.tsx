import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { EditorPanelState, UserState } from '../global_state';

type Props = RouteComponentProps<{ board_name: string }>;

export function BoardPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	const { editor_panel_data, openEditorPanel } = EditorPanelState.useContainer();
	let board_name = props.match.params.board_name;

	function onEditClick(): void {
		if (editor_panel_data) {
			alert('正在編輯其它文章');
		} else {
			openEditorPanel({
				board_name
			});
		}
	}

	return <div>
		<h1>{board_name}</h1>
		{
			(() => {
				if (user_state.login) {
					return <h5 onClick={() => onEditClick()}>發表文章</h5>;
				}
			})()
		}
	</div>;
}