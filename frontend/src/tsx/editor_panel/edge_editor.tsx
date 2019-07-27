import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import '../../css/edge_editor.css';

type Transfuse = -1 | 0 | 1;

function EdgeBlock(props: {
	onClick: () => void,
	onTransfuse: (n: Transfuse) => void,
	onDelete: () => void,
	transfuse: Transfuse,
	id: number
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
	let [ids, setIds] = React.useState([0, 1, 2, 3, 4, 5, 6]);
	let [transfuse, setTransfuse] = React.useState<Transfuse[]>([0, 1, 0, -1, 0, 0, -1]);

	function deleteEdge(i: number): void {
		setIds([...ids.slice(0, i), ...ids.slice(i+1)]);
		setTransfuse([...transfuse.slice(0, i), ...transfuse.slice(i+1)]);
	}

	return <div styleName='body'>
		<div styleName='label'><div>鍵結</div></div>
		<div styleName='editor'>
			{
				ids.map((id, i) => (
					<EdgeBlock key={i}
						id={id}
						transfuse={transfuse[i]}
						onClick={() => props.history.push(`/app/a/${id}`)}
						onTransfuse={n => {
							let tmp = [...transfuse];
							tmp[i] = n;
							setTransfuse(tmp);
						}}
						onDelete={() => deleteEdge(i)}
					/>
				))
			}
		</div>
	</div >;
}

const EdgeEditor = withRouter(_EdgeEditor);

export { EdgeEditor };