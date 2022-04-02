import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import queryString from 'query-string';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FooterState } from '../../global_state/footer';

export enum FooterOption {
    Home,
    Notification,
	Editor,
	Chat,
	Setting,
};

export function Footer(): JSX.Element {
	let { setFooterOption } = FooterState.useContainer();

	let [search_params] = useSearchParams();
	// @ts-ignore
	let footer_option_str: string = search_params.get('footer_option');

	React.useEffect(() => {
		let option: FooterOption = parseInt(footer_option_str) | 0;
		setFooterOption(option);
	}, [footer_option_str, setFooterOption]);

	return <div className={`footer ${style.footer}`}>
		<IconBlock icon="🏠" option={FooterOption.Home} />
		<IconBlock icon="🔔" option={FooterOption.Notification} />
		<IconBlock icon="✏️" option={FooterOption.Editor} />
		<IconBlock icon="🗨️" option={FooterOption.Chat} />
		<IconBlock icon="⚙️" option={FooterOption.Setting} />
	</div>;
}

function IconBlock(props: { icon: string, option: FooterOption }): JSX.Element {
	let { footer_option } = FooterState.useContainer();
	let [search_params] = useSearchParams();
	let is_cur = footer_option == props.option;
	let navigate = useNavigate();
	let location = useLocation();

	function onClick(): void {
		if (is_cur) {
			return;
		}
		let opt = queryString.parse(search_params.toString());
		opt.footer_option = props.option.toString();
		navigate(`${location.pathname}?${queryString.stringify(opt)}`);
	}

	return <div className={is_cur ? `${style.iconBlockSelected} ${style.iconBlock}` : style.iconBlock}>
		<div className={style.icon} onClick={onClick}>
			{props.icon}
		</div>
	</div>;
}
