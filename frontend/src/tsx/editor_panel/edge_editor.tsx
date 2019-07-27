import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import '../../css/edge_editor.css';
import { EditorPanelState, Transfuse } from '../global_state';

function EdgeBlock(props: {
	onClick: () => void,
	onTransfuse: (n: Transfuse) => void,
	onDelete: () => void,
	transfuse: Transfuse,
	id: string
}): JSX.Element {
	function onTransfuseClicked(n: Transfuse): void {
		if (n == props.transfuse) {
			props.onTransfuse(0); // 取消
		} else {
			props.onTransfuse(n);
		}
	}
	return <div styleName='edgeBlock'>
		<div styleName='transfuse'>
			<div styleName={
				[
					'transfuseBtn',
					'inner',
					props.transfuse == 1 ? 'selected' : 'unselected'
				].join(' ')
			} onClick={() => onTransfuseClicked(1)}> ▴ </div>
			<hr />
			<div styleName={
				[
					'transfuseBtn',
					'inner',
					props.transfuse == -1 ? 'selected' : 'unselected'
				].join(' ')
			} onClick={() => onTransfuseClicked(-1)}> ▾ </div>
		</div>
		<div styleName='aid inner' onClick={() => props.onClick()}>a/{props.id}</div>
		<div styleName='delete inner' onClick={() => props.onDelete()}>✗</div>
	</div>;
}

function _EdgeEditor(props: RouteComponentProps): JSX.Element {
	const { editor_panel_data, setEditorPanelData } = EditorPanelState.useContainer();

	function deleteEdge(i: number): void {
		if (editor_panel_data) {
			let data = { ...editor_panel_data };
			data.edges = [...data.edges.slice(0, i), ...data.edges.slice(i + 1)];
			setEditorPanelData(data);
		}
	}

	function setTransfuse(i: number, trans: Transfuse): void {
		if (editor_panel_data) {
			let data = { ...editor_panel_data };
			data.edges = [...data.edges];
			data.edges[i].transfuse = trans;
			setEditorPanelData(data);
		}
	}


	if (editor_panel_data) {
		let edges = editor_panel_data.edges;
		return <div styleName='body'>
			<div styleName='label'><div>鍵結</div></div>
			<div styleName='editor'>
				{
					edges.map(({ article_id, transfuse }, i) => (
						<EdgeBlock key={i}
							id={article_id}
							transfuse={transfuse}
							onClick={() => props.history.push(`/app/a/${article_id}`)}
							onTransfuse={t => setTransfuse(i, t)}
							onDelete={() => deleteEdge(i)}
						/>
					))
				}
			</div>
		</div >;
	} else {
		return <div />;
	}
}

const EdgeEditor = withRouter(_EdgeEditor);

export { EdgeEditor };