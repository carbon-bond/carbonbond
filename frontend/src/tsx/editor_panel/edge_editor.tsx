import * as React from 'react';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import '../../css/edge_editor.css';

type Transfuse = -1 | 0 | 1;

function EdgeBlock(props: {
	onClick: () => void,
	onTransfuse: (n: Transfuse) => void,
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
		<div styleName={
			[
				'transfuse',
				'inner',
				props.transfuse == 1 ? 'selected' : 'unselected'
			].join(' ')
		} onClick={() => onTransfuseClicked(1)}> ▴ </div>
		<div styleName={
			[
				'transfuse',
				'inner',
				props.transfuse == -1 ? 'selected' : 'unselected'
			].join(' ')
		} onClick={() => onTransfuseClicked(-1)}> ▾ </div>
		<div styleName='aid inner' onClick={() => props.onClick()}>a/{props.id}</div>
		<div styleName='delete inner'>✗</div>
	</div>;
}

function _EdgeEditor(props: RouteComponentProps): JSX.Element {
	let ids = [1, 2, 3, 4];
	let [transfuse, setTransfuse] = React.useState<Transfuse[]>([0, 1, 0, -1]);
	return <div styleName='editor'>
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
				/>
			))
		}
	</div>;
}

const EdgeEditor = withRouter(_EdgeEditor);

export { EdgeEditor };