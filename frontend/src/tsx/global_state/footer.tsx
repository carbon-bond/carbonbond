import * as React from 'react';
import { createContainer } from 'unstated-next';
import { FooterOption } from '../mobile/footer';

function useFooterState(): {
    footer_option: FooterOption,
    setFooterOption: (option: FooterOption) => void,
    } {
	let [footer_option, setFooterOption] = React.useState(FooterOption.Home);
	return { footer_option, setFooterOption };
}

export const FooterState = createContainer(useFooterState);