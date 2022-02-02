import * as React from 'react';
import style from '../../css/components/number_over.module.css';

// 點擊 Button 後，Body 將下拉顯示出來
export function NumberOver(props: {
	children: React.ReactNode,
	number: number,
	className?: string,
	top?: string,
	left?: string
}): JSX.Element {
	return <div className={style.numberOver + ' ' + props.className}>
		{props.children}
		{
			props.number > 0 ?
				<span className={style.number} style={{ top: props.top, left: props.left }}>
					{props.number}
				</span> :
				<></>
		}
	</div>;
}