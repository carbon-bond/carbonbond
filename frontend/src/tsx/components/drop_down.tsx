import * as React from 'react';
import '../../css/components/drop_down.css';

// 點擊 Button 後，Body 將下拉顯示出來
export function DropDown(props: {
	button: JSX.Element,
	body: null | JSX.Element,
	onExtended?: Function,
	forced_expanded?: boolean,
}): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	let should_expand = extended && props.body != null;
	if (typeof props.forced_expanded != 'undefined') {
		should_expand = props.forced_expanded;
	}
	return <div styleName="wrap">
		<div styleName="button" onClick={() => {
			setExtended(!extended);
			if (props.onExtended) {
				props.onExtended();
			}
		}}>
			{props.button}
		</div>
		<div styleName="body">
			{
				should_expand
					? <>
						<div styleName="triangle"></div>
						<div style={{position: 'relative'}}> {props.body} </div>
					</>
					: null
			}
		</div>
	</div>;
}