import * as React from 'react';
import '../../../css/mobile/footer.css';
import { createContainer } from 'unstated-next';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { RouteComponentProps } from 'react-router-dom';

export enum FooterOption {
    Home,
    Notification,
};

function _Footer(props: RouteComponentProps): JSX.Element {
	let { setFooterOption } = FooterState.useContainer();

	let history = props.history;
	let opt = queryString.parse(history.location.search);
	// @ts-ignore
	let footer_option_str: string = opt.footer_option;

	React.useEffect(() => {
		let option: FooterOption = parseInt(footer_option_str) | 0;
		setFooterOption(option);
	}, [footer_option_str, setFooterOption]);

	return <div className="footer" className="footer">
		<IconBlock icon="🏠" option={FooterOption.Home} {...props} />
		<IconBlock icon="🔔" option={FooterOption.Notification}  {...props} />
	</div>;
}

function IconBlock(props: { icon: string, option: FooterOption } & RouteComponentProps): JSX.Element {
	let { footer_option } = FooterState.useContainer();
	let history = props.history;
	let is_cur = footer_option == props.option;

	function onClick(): void {
		if (is_cur) {
			return;
		}
		let opt = queryString.parse(history.location.search);
		opt.footer_option = props.option.toString();
		history.push(`${history.location.pathname}?${queryString.stringify(opt)}`);
	}

	return <div className={is_cur ? 'iconBlockSelected iconBlock' : 'iconBlock'}>
		<div className="icon" onClick={onClick}>
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
export const Footer = withRouter(_Footer);