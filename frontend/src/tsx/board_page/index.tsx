import * as React from 'react';
import { RouteComponentProps } from 'react-router';

type Props = RouteComponentProps<{ board_name: string }>;

export function BoardPage(props: Props): JSX.Element {
	return <h1>{props.match.params.board_name}</h1>;
}