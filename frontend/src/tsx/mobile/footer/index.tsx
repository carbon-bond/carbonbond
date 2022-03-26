import * as React from 'react';
import style from '../../../css/mobile/footer.module.css';
import { createContainer } from 'unstated-next';
import queryString from 'query-string';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export enum FooterOption {
    Home,
    Notification,
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

	return <div className={is_cur ? 'iconBlockSelected iconBlock' : 'iconBlock'}>
		<div className={style.icon} onClick={onClick}>
			{props.icon}
		</div>
	</div>;
}

function useFooterState(): {
    footer_option: FooterOption,
    setFooterOption: (option: FooterOption) => void,
    } {
	let [footer_option, setFooterOption] = React.useState(FooterOption.Home);
	return { footer_option, setFooterOption };
}

export const FooterState = createContainer(useFooterState);