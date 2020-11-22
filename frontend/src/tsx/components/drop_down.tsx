import * as React from 'react';
import '../../css/components/drop_down.css';

// 點擊 Button 後，Body 將下拉顯示出來
export function DropDown(props: {
	button: JSX.Element,
	body: null | JSX.Element,
	onExtended?: Function
}): JSX.Element {
	const [extended, setExtended] = React.useState(false);
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
				extended && props.body
					? <>
						<div styleName="triangle"></div>
						{props.body}
					</>
					: null
			}
		</div>
	</div>;
}