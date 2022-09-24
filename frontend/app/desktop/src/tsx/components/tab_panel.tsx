import * as React from 'react';
import { Link } from 'react-router-dom';
import style from '../../css/components/tab_panel.module.css';

interface TabPanelItemProps {
	title: string
	is_disable: boolean
	element: JSX.Element
}

interface TabPanelWithLinkItemProps {
	title: string
	is_disable: boolean
	element: JSX.Element
	link: string
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
				<div key={tab_item.props.title}>
					{selectTab == index ? tab_item.props.element : <></>}
				</div>
			))}
		</div>
	</div>;
}

export function TabPanelItem(props: {title: string, is_disable: boolean, element: JSX.Element}): JSX.Element {
	return props.element;
}

export function TabPanelWithLink(props: {children: React.ReactElement<TabPanelWithLinkItemProps>[], select_tab: number }): JSX.Element {
	return <div className={style.works}>
		<div className={style.navigateBar}>
			{props.children.map((tab_item, index) => (
				<div key={index} className={(tab_item.props.is_disable ? style.navigateTabDisable : style.navigateTab) +
						((!tab_item.props.is_disable && props.select_tab == index) ? ` ${style.navigateTabActive}` : '') }>
					{!tab_item.props.is_disable ?  <Link to={tab_item.props.link} style={{ textDecoration: 'none' }}>
						{tab_item.props.title}
					</Link> : <span>{tab_item.props.title}</span>}
				</div>
			))}
		</div>
		<div className={style.content}>
			{props.children.map((tab_item, index) => (
				<div key={tab_item.props.title}>
					{props.select_tab == index ? tab_item.props.element : <></>}
				</div>
			))}
		</div>
	</div>;
}

export function TabPanelWithLinkItem(props: {title: string, is_disable: boolean, element: JSX.Element, link: string}): JSX.Element {
	return props.element;
}
