import * as React from 'react';
import style from '../../css/components/invalid_message.module.css';

export function InvalidMessage(props: { msg: string }): JSX.Element {
	return <span className={style.invalidMessage}>⚠ {props.msg}</span>;
}