import * as React from 'react';
import style from '../css/reset_password.module.css';
import { API_FETCHER, unwrap } from '../ts/api/api';
import { useParams } from 'react-router';
import { toastErr } from './utils';

export function ChangeEmail(): JSX.Element {
	let params = useParams<{token: string}>();
	let token = params.token!;
	let [fetching, setFetching] = React.useState<boolean>(true);
	let [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		API_FETCHER.userQuery.changeEmailByToken(token).then(res => {
			if ('Err' in res) {
				if ('LogicError' in res.Err) {
					setError(res.Err.LogicError.msg.join(','));
					return;
				}
			}
			unwrap(res);
		})
		.catch(err => {
			toastErr(err);
		})
		.finally(() => {setFetching(false);});
	});

	if (fetching) {
		// signupPage 這種簡單版面，統一制定一個 CSS class 來用
		return <div className={style.signupPage}>
			正在處理電子信箱更換....
		</div>;
	} else if (error) {
		return <div className={style.signupPage}>
			<div>{error}</div>
		</div>;
	} else {
		return <div className={style.signupPage}>
			成功更換電子信箱！
		</div>;
	}
}