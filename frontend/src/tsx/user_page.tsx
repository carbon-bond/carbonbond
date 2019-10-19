import * as React from 'react';
import { RouteComponentProps } from 'react-router';

type Props = RouteComponentProps<{ user_name: string }>;

function UserPage(props: Props): JSX.Element {
	const user_name = props.match.params.user_name;
	return <div>{user_name} 的個人頁</div>;
}

export {
	UserPage
};