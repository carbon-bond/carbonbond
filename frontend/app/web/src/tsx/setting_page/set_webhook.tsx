import * as React from 'react';
import style from '../../css/setting_page.module.css';

export function SetWebhook(): JSX.Element {
	return <div className={style.setting}>
		<div className={style.name}>Webhook</div>
		<button> 新增 </button>
	</div>;
}