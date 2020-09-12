import * as React from 'react';
import '../../css/components/invalid_message.css';

export function InvalidMessage(props: { msg: string }): JSX.Element {
	return <span styleName="invalidMessage">⚠ {props.msg}</span>;
}