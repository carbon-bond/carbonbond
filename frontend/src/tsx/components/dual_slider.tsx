import * as React from 'react';
import style from '../../css/components/dual_slider.module.css';

type Props = {
	range: [number, number],
	onChange: (v: [number, number]) => void
	transform?: (n: number) => number
};

type Event = React.TouchEvent<HTMLDivElement> | React.MouseEvent;

function getX(evt: Event): number {
	if ('touches' in evt && evt.touches.length > 0) {
		return evt.touches[0].clientX;
	} else if ('clientX' in evt) {
		return evt.clientX;
	} else {
		throw '找不到座標…';
	}
}

export function DualSlider(props: Props): JSX.Element {
	let [is_sel_down, setIsSelDown] = React.useState(false);
	let [move_current_value, setMoveCurrentValue] = React.useState(0);
	let [move_start_x, setMoveStartX] = React.useState(0);
	let [move_start_value, setMoveStartValue] = React.useState(0);
	let [index_sel_down, setIndexSelDown] = React.useState(0);
	let [box_width, setBoxWidth] = React.useState(0);
	let [value, setValue] = React.useState<[number, number]>(props.range);

	let size = props.range[1] - props.range[0];
	let transform = props.transform ? props.transform : ((n: number) => n);

	function move(evt: Event): void {
		if (is_sel_down) {
			let client_x = getX(evt);
			setMoveCurrentValue(getMoveCurrentValue(client_x));
			setValue(getValue());
		}
	}
	function getMoveCurrentValue(move_current_x: number): number {
		let move_box_proportion = (move_current_x - move_start_x) / box_width;
		const move_into_limit = size * move_box_proportion;
		let move_current_value = move_start_value + move_into_limit;
		move_current_value = move_current_value < props.range[0] ? props.range[0] : move_current_value;
		move_current_value = move_current_value > props.range[1] ? props.range[1] : move_current_value;
		return move_current_value;
	}
	function startMoving(event: Event, index: number): void {
		const client_x = getX(event);
		setIsSelDown(true);
		setIndexSelDown(index);
		setMoveStartValue(value[index]);
		setMoveCurrentValue(value[index]);
		setMoveStartX(client_x);
		setBoxWidth(event.currentTarget.parentElement!.offsetWidth);
		event.stopPropagation();
	}

	function stopMoving(evt: Event): void {
		if (is_sel_down) {
			let v = getValue();
			setValue(v);
			setIsSelDown(false);
			props.onChange(v);
		}
		evt.stopPropagation();
	}
	function getValue(): [number, number] {
		let v: [number, number] = [...value];
		if (is_sel_down) {
			v[index_sel_down] = transform(move_current_value);
		}
		if (v[1] <= v[0]) {
			v[0] = Math.min(v[0], v[1]);
			v[1] = v[0] + 1;
		}
		return v;
	}
	function getLeftPositions(): [number, number] {
		let v: [number, number] = [...value];
		let r: [number, number] = [...props.range];
		let left = [v[0] - r[0], v[1] - r[0]];
		let left_pos: [number, number] = [left[0] / size * 100, left[1] / size * 100];
		return left_pos;
	}

	let left_pos = getLeftPositions();
	let crossline_pos = left_pos.slice();
	crossline_pos.sort((a, b) => a - b);
	crossline_pos[1] = 100 - crossline_pos[1];

	const style_crossline = {
		left: crossline_pos[0] + '%',
		right: crossline_pos[1] + '%',
		backgroundColor: 'red',
	};
	const style_selector0 = {
		left: left_pos[0] + '%',
	};
	const style_selector1 = {
		left: left_pos[1] + '%',
	};

	return <div className={style.component}
		onMouseMove={move}
		onMouseLeave={stopMoving}
		onMouseUp={stopMoving}

		onTouchMove={move}
		onTouchEnd={stopMoving}
		data-name="component">

		<div className={style.sliders}>
			<div className={style.line}><div className={style.crossLine} style={style_crossline}></div></div>
			<div
				className={style.selector}
				style={style_selector0}
				onMouseDown={evt => startMoving(evt, 0)}
				onTouchStart={evt => startMoving(evt, 0)}
			>
				<div></div>
			</div>
			<div
				className={style.selector}
				style={style_selector1}
				onMouseDown={evt => startMoving(evt, 1)}
				onTouchStart={evt => startMoving(evt, 1)}
			>
				<div></div>
			</div>
		</div>

		<div className={style.values}>
			<div className={style.limit} style={{left: '0%'}}>{props.range[0]}</div>
			<div className={style.value} style={style_selector0}>{value[0]}</div>
			<div className={style.value} style={style_selector1}>{value[1]}</div>
			<div className={style.limit} style={{left: '100%'}}>{props.range[1]}</div>
		</div>

	</div>;

}