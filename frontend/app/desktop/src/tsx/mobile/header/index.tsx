import * as React from 'react';

import style from '../../../css/header/index.module.css';
import panel_style from '../../../css/mobile/panel.module.css';

import { ArticleLocation, LocationState } from '../../global_state/location';

import { useNavigate } from 'react-router';
import { LoginModal } from '../../header/login_modal';
import { PanelMain, PanelMenu, Option } from '../../left_panel';
import { STORAGE_NAME } from '../../../ts/constants';
import { Links, ModalStatus } from '../../header';
import { UserState } from '../../global_state/user';

// 當左邊欄展開時，給原本的畫面加一層濾鏡
function Filter(props: { setExpanding: (expanding: boolean) => void }): JSX.Element {
	return <div
		onClick={() => {
			props.setExpanding(false);
		}}
		className={panel_style.filter} >
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
			<div className={panel_style.leftPanel}>
				<PanelMenu option={option} toggleOption={toggleOption}/>
				<PanelMain option={option} onLinkClick={() => { props.setExpanding(false); }}/>
			</div>
			<Filter setExpanding={props.setExpanding} />
		</>
	);
}

function RightPanel(props: { setExpanding: (expanding: boolean) => void }): JSX.Element {
	return (
		<>
			<div className={panel_style.rightPanel} onClick={() => props.setExpanding(false)}>
				{Links()}
			</div>
			<Filter setExpanding={props.setExpanding} />
		</>
	);
}

function Header(): JSX.Element {
	const { current_location } = LocationState.useContainer();
	const [ expanding_left_panel, setExpandingLeftPanel ] = React.useState(false);
	const [ expanding_right_panel, setExpandingRightPanel ] = React.useState(false);
	const [modal_status, setModalStatus] = React.useState<ModalStatus | null>(null);
	const navigate = useNavigate();
	const { user_state } = UserState.useContainer();

	let title = current_location ? current_location.show_in_header() : '所有看板';
	function routeToBoard(): void {
		if (current_location instanceof ArticleLocation) {
			navigate(window.location.pathname.split('/').slice(0, -2).join('/'));
		}
	}

	return (
		<div className={`header ${style.header}`}>
			{ expanding_left_panel ? <LeftPanel setExpanding={setExpandingLeftPanel}/> : null }
			{ expanding_right_panel ? <RightPanel setExpanding={setExpandingRightPanel}/> : null }
			<div className={style.container}>
				<div className={style.leftSet} onClick={() => setExpandingLeftPanel(true)}>
					☰
				</div>
				<div className={style.middleSet}>
					<div className={style.location} style={{ fontSize: 14 }} onClick={routeToBoard}>{title}</div>
				</div>
				<div className={style.rightSet}>
					<div className={style.wrap}>
						{
							user_state.login
								? <img
									onClick={() => setExpandingRightPanel(true)}
									className={style.avatar}
									src={`/avatar/${user_state.user_name}`} />
								: user_state.fetching
									? <></>
									: <div className={style.login} onClick={() => setModalStatus(ModalStatus.Login)}>登入</div>
						}
					</div>
				</div>
				{ modal_status ? <LoginModal setModalStatus={setModalStatus} modal_status={modal_status}/> : null }
			</div>
		</div>
	);
}

export { Header };
