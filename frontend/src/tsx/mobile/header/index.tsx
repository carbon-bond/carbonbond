import * as React from 'react';

import style from '../../../css/header/index.module.css';

import { UserState } from '../../global_state/user';
import { LocationCacheState } from '../../global_state/location_cache';

import { Menu } from './menu';
import { DropDown } from '../../components/drop_down';
import { SearchBar } from '../../header/search_bar';
import { useNavigate } from 'react-router';
import carbonbondIconURL from '../../../img/icon-128x128.png';

export function Row<T>(props: { children: T, onClick?: () => void }): JSX.Element {
	return <div className={style.row} onClick={() => {
		if (typeof props.onClick != 'undefined') {
			props.onClick();
		}
	}}>
		<div className={style.space} />
		<div>{props.children}</div>
		<div className={style.space} />
	</div>;
}

function Header(): JSX.Element {
	const { user_state } = UserState.useContainer();
	const { current_location } = LocationCacheState.useContainer();
	const [ expanding_menu, setExpandingMenu ] = React.useState(false);
	const navigate = useNavigate();

	function UserBlock(): JSX.Element | null {
		if (!user_state.login) {
			return null;
		}
		return <div className={style.userInfo}>
			<img src={`/avatar/${user_state.user_name}`} />
			<div className={style.userName}>{user_state.user_name}</div>
			<div className={style.energy}>☘ {user_state.energy}</div>
		</div>;
	}
	function UserStatus(): JSX.Element {
		return <>
			{
				// user_state.login ? <div className={style.icon}>🔔</div> : null
			}
			<div className={style.wrap}>
				<DropDown
					hide_triangle
					forced_expanded={expanding_menu}
					button={<div className={style.icon} onClick={() => setExpandingMenu(p => !p)}> ☰ </div>}
					body={<Menu
						userBlock={<UserBlock/>}
						onCoverClicked={() => setExpandingMenu(false)}/>}
				/>
			</div>
		</>;
	}
	let title = current_location ? current_location.name : '所有看板';
	function routeToBoard(): void {
		if (current_location?.is_article_page) {
			navigate(window.location.pathname.split('/').slice(0, -2).join('/'));
		}
	}

	return (
		<div className={`header ${style.header}`}>
			<div className={style.container}>
				<div className={style.leftSet}>
					<div className={style.carbonbond} onClick={() => navigate('/app')}>
						<img className={style.imageIcon} src={carbonbondIconURL} alt="" />
					</div>
					<div className={style.location} style={{ fontSize: 14 }} onClick={routeToBoard}>{title}</div>
					<SearchBar cur_board={current_location ? current_location.name : ''} hide_select_board/>
				</div>
				<div className={style.rightSet}>
					<UserStatus/>
				</div>
			</div>
		</div>
	);
}

export { Header };
