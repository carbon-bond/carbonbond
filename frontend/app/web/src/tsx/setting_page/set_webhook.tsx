import * as React from 'react';
import style from '../../css/setting_page.module.css';
import { toast } from 'react-toastify';
import { API_FETCHER, unwrap } from 'carbonbond-api/api_utils';
import { toastErr } from '../utils';
import { useForm } from 'react-hook-form';
import { InvalidMessage } from '../components/invalid_message';
import { Webhook } from 'carbonbond-api/api_trait';
import { relativeDate } from '../../ts/date';

// TODO: 刪除
function ShowWebhook(props: { webhook: Webhook, setRefresh: () => void }): JSX.Element {
	return <div className={style.webhook}>
		<div>
			<div>網址 {props.webhook.target_url}</div>
			<div>密鑰 {props.webhook.secret}</div>
			<div>建立於 {relativeDate(new Date(props.webhook.create_time))}</div>
		</div>
		<div>
			<button onClick={() => {
				API_FETCHER.userQuery.deleteWebhook(props.webhook.id)
				.then(data => {
					toast('已刪除 webhook');
					props.setRefresh();
					unwrap(data);
				}).catch(err => {
					toastErr(err);
				});
			}}>
				刪除
			</button>
		</div>
	</div>;
}

export function SetWebhook(): JSX.Element {
	const {
		register,
		handleSubmit,
		errors,
		reset
	} = useForm({ mode: 'onSubmit' });
	let [webhooks, setWebhooks] = React.useState<Webhook[]>([]);
	let [refresh, setRefresh] = React.useState<boolean>(true);

	React.useEffect(() => {
		API_FETCHER.userQuery.queryWebhooks()
			.then(data => {
				setWebhooks(unwrap(data));
			}).catch(err => {
				toastErr(err);
			});

	}, [refresh]);

	function onSubmit(data: { target_url: string, secret: string }): void {
		API_FETCHER.userQuery.addWebhook(data.target_url, data.secret)
		.then(res => {
			unwrap(res);
			toast('成功新增 webhook');
			setRefresh(!refresh);
			reset();
		})
		.catch(err => toastErr(err));
	}

	return <div className={`${style.webhookPage} ${style.setting}`}>
		<div className={style.name}>Webhook</div>
		{
			webhooks.map(webhook =>
				<ShowWebhook
					setRefresh={() => setRefresh(!refresh)}
					webhook={webhook}
					key={webhook.id} />)
		}
		<form onSubmit={handleSubmit(onSubmit)}>
			<div>
				<label htmlFor="target_url" className={style.label}>Webhook 網址</label>
				<input type="text" placeholder="URL" name="target_url" id="target_url" ref={register()} />
				{errors.targt_url && <InvalidMessage msg={errors.targt_url.message} />}
			</div>

			<div>
				<label htmlFor="secret" className={style.label}>自訂密鑰</label>
				<input type="text" placeholder="自訂密鑰" name="secret" id="secret" ref={register()} />
				{errors.secret && <InvalidMessage msg={errors.secret.message} />}
			</div>
			<div>
				<button> 新增 </button>
			</div>
		</form>
	</div>;
}