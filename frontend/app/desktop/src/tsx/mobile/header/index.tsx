import * as React from 'react';

import style from '../../../css/header/index.module.css';
import left_panel_style from '../../../css/mobile/left_panel.module.css';

import { ArticleLocation, LocationState } from '../../global_state/location';

import { SearchBar } from '../../header/search_bar';
import { useNavigate } from 'react-router';
import { LoginModal } from '../../header/login_modal';
import { PanelMain, PanelMenu, Option } from '../../left_panel';
import { STORAGE_NAME } from '../../../ts/constants';

// 當左邊欄展開時，給原本的畫面加一層濾鏡
function Filter(props: { setExpanding: (expanding: boolean) => void }): JSX.Element {
	return <div
		onClick={() => {
			props.setExpanding(false);
		}}
		className={left_panel_style.filter} >
	</div>;
}

function LeftPanel(props: { setExpanding: (expanding: boolean) => void }): JSX.Element {
	const [option, setOption] = React.useState(Option.None);

	React.useEffect(() => {
		const previous_record = localStorage[STORAGE_NAME.leftbar_expand] ?? Option.Browse;
		setOption(previous_record);
	}, []);

	function toggleOption(op: Option): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
		return () => {
			if (op != option) {
				setOption(op);
				localStorage[STORAGE_NAME.leftbar_expand] = op;
			}
		};
	}

	return (
		<>
			<div className={left_panel_style.leftPanel}>
				<PanelMenu option={option} toggleOption={toggleOption}/>
				<PanelMain option={option}/>
			</div>
			<Filter setExpanding={props.setExpanding} />
		</>
	);
}

function Header(): JSX.Element {
	const { current_location } = LocationState.useContainer();
	const [ expanding_menu, setExpandingMenu ] = React.useState(false);
	let [logining, setLogining] = React.useState(false);
	const navigate = useNavigate();

	let title = current_location ? current_location.show_in_header() : '所有看板';
	function routeToBoard(): void {
		if (current_location instanceof ArticleLocation) {
			navigate(window.location.pathname.split('/').slice(0, -2).join('/'));
		}
	}

	return (
		<div className={`header ${style.header}`}>
			{ expanding_menu ? <LeftPanel setExpanding={setExpandingMenu}/> : null }
			<div className={style.container}>
				<div className={style.leftSet} onClick={() => setExpandingMenu(true)}>
					☰
				</div>
				<div className={style.rightSet}>
					<div className={style.location} style={{ fontSize: 14 }} onClick={routeToBoard}>{title}</div>
					<SearchBar cur_board={current_location ? current_location.show_in_header() : ''} hide_select_board/>
				</div>
				{ logining ? <LoginModal setLogining={setLogining}/> : null }
			</div>
		</div>
	);
}

export { Header };
