import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { UserState } from './global_state';

type Props = RouteComponentProps<{}>;

export function PartyPage(props: Props): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [fetching, setFetching] = React.useState(true);

	setTimeout(() => setFetching(false), 1000);
	React.useEffect(() => {
		if (!user_state.login && !user_state.fetching) {
			props.history.replace('app');
		}
	}, [user_state]);

	if (fetching) {
		return <div> 載入頁 </div>;
	} else {
		return <div> 政黨頁 </div>;
	}
}