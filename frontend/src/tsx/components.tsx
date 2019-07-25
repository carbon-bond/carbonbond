// 手刻組件庫
import * as React from 'react';
import useOnClickOutside from 'use-onclickoutside';

import '../css/bottom_panel.css';

export function DropDown(props: {
	btn_style?: React.CSSProperties,
	selected_style?: React.CSSProperties,
	option_style?: React.CSSProperties,
	background_style?: React.CSSProperties,
	option_max_height?: number,
	hover_color?: string,
	value: string,
	options: string[],
	onChange: (s: string) => void
}): JSX.Element {
	let [open, setOpen] = React.useState(false);
	let default_hovering: boolean[] = Array(props.options.length-1).fill(false);
	let [hovering, setHovering] = React.useState(default_hovering);

	function changeHovering(idx: number, is_in: boolean): void {
		let h = [...hovering];
		h[idx] = is_in;
		setHovering(h);
	}
	let hover_color = props.hover_color || 'inherit';

	let ref = React.useRef(null);
	useOnClickOutside(ref, () => setOpen(false));

	return <div style={{
		...props.btn_style,
		position: 'relative',
		cursor: 'pointer'
	}}>
		<div style={{
			height: '100%',
			width: '100%',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		}} onClick={() => {
			setOpen(!open);
			setHovering(default_hovering);
		}}>
			<p> {props.value} </p>
		</div>
		{
			(() => {
				if (open) {
					return <div style={{
						...props.background_style,
						position: 'absolute',
						top: '100%',
						left: '-1%',
						width: '100%',
						overflowY: 'auto',
						maxHeight: props.option_max_height
					}}>
						{props.options.map((txt, i) => {
							if (txt != props.value) {
								return <div key={i} ref={ref} style={{
									...props.option_style,
									width: '100%',
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									backgroundColor: hovering[i] ? hover_color : 'inherit'
								}} onClick={() => {
									props.onChange(txt);
									setOpen(false);
								}} onMouseEnter={() => {
									changeHovering(i, true);
								}} onMouseLeave={() => {
									changeHovering(i, false);
								}}>
									<p>{txt}</p>
								</div>;
							}
						})}
					</div>;
				}
			})()
		}
	</div>;
}