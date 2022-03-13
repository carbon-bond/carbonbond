import * as React from 'react';

export function ScalableInput(props: {onChange: ((value: string) => void), value: string}): JSX.Element {
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const measurer = React.useRef<HTMLInputElement | null>(null);
	const [width, setWidth] = React.useState<number>(30);

	React.useEffect(() => {
		if (measurer.current) {
			setWidth(measurer.current.offsetWidth + 10);
		}
	}, [props.value]);

	return <span>
		{
			<>
				<input
					value={props.value}
					ref={inputRef}
					style={{ width }}
					onChange={(evt) => {
						props.onChange(evt.target.value);
					}}
				/>
			</>
		}
		<span style={{position: 'absolute', opacity: 0}} ref={measurer}>{props.value}</span>
	</span>;
}