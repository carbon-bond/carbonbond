// 手刻組件庫
import * as React from 'react';
import useOnClickOutside from 'use-onclickoutside';

import '../css/components.css';

export function DropDown(props: {
	style?: React.CSSProperties,
	selected_style?: React.CSSProperties,
	option_style?: React.CSSProperties,
	background_style?: React.CSSProperties,
	hover_color?: string,
	value: string,
	options: string[],
	onChange: (s: string) => void
}): JSX.Element {
	let [open, setOpen] = React.useState(false);
	let hover_color = props.hover_color || 'inherit';

	let ref = React.useRef(null);
	useOnClickOutside(ref, () => setOpen(false));

	return <div ref={ref} style={props.style} styleName='dropDown'>
		<div styleName='Btn' onClick={() => {
			if (props.options.length > 1) {
				setOpen(!open);
			}
		}}>
			<p style={{ flex: 3 }} />
			<p style={{ flex: 9, textAlign: 'center' }}> {props.value} </p>
			<p style={{ flex: 2, textAlign: 'right', transition: '.2s', opacity: open ? 0 : 1 }}>▾</p>
			<p style={{ flex: 1 }} />
		</div>
		<div styleName='Background' style={{
			...props.background_style,
			top: open ? '95%' : '0%',
			opacity: open ? 1 : 0,
			visibility: open ? 'visible' : 'hidden',
		}}>
			{props.options.map((txt, i) => {
				if (txt != props.value) {
					return <div key={i} style={{
						...props.option_style,
						...{ '--hover-color': hover_color } as React.CSSProperties
					}} onClick={() => {
						props.onChange(txt);
						setOpen(false);
					}}
					title='test-title'
					styleName='Option'>
						<p>{txt}</p>
					</div>;
				}
			})}
		</div>
	</div>;
}