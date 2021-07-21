import * as React from 'react';
import {invalidMessage} from '../../css/components/invalid_message.module.css';

export function InvalidMessage(props: { msg: string }): JSX.Element {
	return <span className={invalidMessage}>⚠ {props.msg}</span>;
}