import * as React from 'react';
import style from '../../css/components/tab_panel.module.css';

export function TabPanel(props: {children: JSX.Element[] }): JSX.Element {
	const [selectTab, setSelectTab] = React.useState<number>(0);

	function handleSelectTab(tabIndex: number): void {
		setSelectTab(tabIndex);
	}

	return <div className={style.works}>
		<div className={style.navigateBar}>
			{props.children.map((tab_item, index) => (
				<div key={index} className={style.navigateTab + (selectTab == index ? ` ${style.navigateTabActive}` : '')} onClick={() => { handleSelectTab(index); }}>{tab_item.props.title}</div>
			))}
		</div>
		<div className={style.content}>
			{props.children.map((tab_item, index) => (
				<div>
					{selectTab == index ? tab_item.props.element : <></>}
				</div>
			))}
		</div>
	</div>;
}

export function TabPanelItem(props: {title: string, element: JSX.Element}): JSX.Element {
	return props.element;
}
