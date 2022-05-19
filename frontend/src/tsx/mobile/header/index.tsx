import * as React from 'react';

import style from '../../../css/header/index.module.css';

import { LocationCacheState } from '../../global_state/location_cache';

import { SearchBar } from '../../header/search_bar';
import { useNavigate } from 'react-router';
import carbonbondIconURL from '../../../img/icon-128x128.png';
import { UserState } from '../../global_state/user';

function Header(): JSX.Element {
	const { user_state } = UserState.useContainer();
	const { current_location } = LocationCacheState.useContainer();
	const navigate = useNavigate();

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
				</div>
				<div className={style.middleSet}>
					<SearchBar cur_board={current_location ? current_location.name : ''} hide_select_board />
				</div>
				<button>登入</button>
				<button>註冊</button>
			</div>
		</div>
	);
}

export { Header };
