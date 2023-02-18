import * as React from 'react';
import style from '../../css/components/drop_down.module.css';

// 點擊 Button 後，Body 將下拉顯示出來
export function DropDown(props: {
	button: JSX.Element,
	body: null | JSX.Element,
	onExtended?: Function,
	forced_expanded?: boolean,
	hide_triangle?: boolean,
}): JSX.Element {
	const [extended, setExtended] = React.useState(false);
	let should_expand = extended && props.body != null;
	if (typeof props.forced_expanded != 'undefined') {
		should_expand = props.forced_expanded;
	}
	return <div className={style.wrap}>
		<div className={style.button} onClick={() => {
			setExtended(!extended);
			if (props.onExtended) {
				props.onExtended();
			}
		}}>
			{props.button}
		</div>
		<div className={style.dropDown}>
			{
				should_expand
					? <>
						{props.hide_triangle ? null : <div className={style.triangle}></div>}
						<div className={style.body}> {props.body} </div>
					</>
					: null
			}
		</div>
	</div>;
}