import { API_FETCHER, unwrap } from '../../ts/api/api';
import * as React from 'react';
import { createContainer } from 'unstated-next';
import { toastErr } from '../utils';
import { Config } from '../../ts/api/api_trait';
const { useState } = React;

function useConfigState(): { server_config: Config } {
	const [server_config, setServerConfig] = useState<Config>({
		min_password_length: 0,
		max_password_length: 10000,
		advertisement_contact_email: null
	});

	async function getConfig(): Promise<void> {
		try {
			const config = unwrap(await API_FETCHER.configQuery.queryConfig());
			setServerConfig(config);
		} catch (err) {
			toastErr(err);
		}
		return;
	}

	React.useEffect(() => {
		getConfig();
	}, []);

	return { server_config };
}

export const ConfigState = createContainer(useConfigState);