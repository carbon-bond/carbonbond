import * as React from 'react';
import style from '../../css/components/tab_panel.module.css';

interface TabPanelItemProps {
	title: string
	is_disable: boolean
	element: JSX.Element
}

export function TabPanel(props: {children: React.ReactElement<TabPanelItemProps>[] }): JSX.Element {
	const [selectTab, setSelectTab] = React.useState<number>(0);

	function handleSelectTab(tabIndex: number): void {
		setSelectTab(tabIndex);
	}

	return <div className={style.works}>
		<div className={style.navigateBar}>
			{props.children.map((tab_item, index) => (
				<div key={index}
					className={(tab_item.props.is_disable ? style.navigateTabDisable : style.navigateTab) +
								((!tab_item.props.is_disable && selectTab == index) ? ` ${style.navigateTabActive}` : '')
					}
					onClick={() => { if (!tab_item.props.is_disable) {handleSelectTab(index);} }}>
					{tab_item.props.title}
				</div>
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

export function TabPanelItem(props: {title: string, is_disable: boolean, element: JSX.Element}): JSX.Element {
	return props.element;
}
