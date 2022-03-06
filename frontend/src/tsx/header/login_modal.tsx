import { UserState } from '../global_state/user';
import { toastErr, useInputValue } from '../utils';
import useOnClickOutside from 'use-onclickoutside';
import { API_FETCHER, unwrap_or, unwrap } from '../../ts/api/api';
import * as React from 'react';
import { toast } from 'react-toastify';
import { ModalButton, ModalWindow } from '../components/modal_window';
import { isEmail } from '../../ts/regex_util';
import style from '../../css/header/login_modal.module.css';
import { LawyerbcResult, LawyerbcResultMini } from '../../ts/api/api_trait';

enum Status {
	ForgetPassword,
	Login
};

function LoginStatus(
	props: {
		setLogining: (logining: boolean) => void,
		setStatus: (status: Status) => void
	}
): JSX.Element {
	const [password_visible, SetPasswordVisible] = React.useState(false);
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	const { setLogin } = UserState.useContainer();
	async function login_request(name: string, password: string): Promise<void> {
		try {
			let user = unwrap(await API_FETCHER.userQuery.login(name, password));
			props.setLogining(false);
			if (user) {
				setLogin({
					user_name: user.user_name,
					id: user.id,
					email: user.email,
					energy: user.energy,
				});
				toast('登入成功');
			} else {
				toast('帳號或密碼錯誤');
			}
		} catch (err) {
			toastErr(err);
		}
		return;
	}
	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.key == 'Enter') {
			login_request(name.value, password.value);
		} else if (e.key == 'Escape') {
			props.setLogining(false);
		}
	}

	const buttons: ModalButton[] = [
		{ text: '登入', handler: () => login_request(name.value, password.value) },
		{ text: '取消', handler: () => props.setLogining(false) }
	];

	function getBody(): JSX.Element {
		return <div className={style.loginModal}>
			<div>
				<input type="text" className={style.inputContainer} placeholder="😎 使用者名稱" autoFocus {...name} onKeyDown={onKeyDown} />
				<div className={style.inputContainer}>
					<input type={password_visible ? 'text' : 'password'} className={style.password} placeholder="🔒 密碼" {...password} onKeyDown={onKeyDown} />
					<span className={style.eye} onClick={() => {SetPasswordVisible(!password_visible);}}>{password_visible ? '🙈' : '👁️'}</span>
				</div>
				<div className={style.fogetPassword} onClick={() => {props.setStatus(Status.ForgetPassword);}}>忘記密碼？</div>
			</div>
		</div>;
	}

	return <ModalWindow
		title="登入"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setLogining}
	/>;
}

function ForgetPasswordStatus(
	props: {
		setLogining: (logining: boolean) => void,
		setStatus: (status: Status) => void
	}
): JSX.Element {
	const [sent, setSent] = React.useState(false);
	let email = useInputValue('').input_props;
	async function reset_password_request(email: string): Promise<void> {
		try {
			if (!isEmail(email)) {
				throw '信箱格式異常';
			}
			unwrap(await API_FETCHER.userQuery.sendResetPasswordEmail(email));
			setSent(true);
		} catch (err) {
			toastErr(err);
		}
		return;
	}

	function getBody(): JSX.Element {
		return <div className={style.signupModal}>
			<input type="text" placeholder="😎 信箱" autoFocus {...email} />
			{
				sent ?
					<p>已寄出重置密碼信</p> :
					<p>&nbsp;</p>
			}
		</div>;
	}
	const buttons: ModalButton[] = [
		{ text: sent ? '再一次' : '重置密碼', handler: () => reset_password_request(email.value) },
		{ text: '返回', handler: () => props.setStatus(Status.Login) }
	];
	return <ModalWindow
		title="找回密碼"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setLogining}
	/>;
}

export function LoginModal(props: { setLogining: (logining: boolean) => void }): JSX.Element {
	let ref_all = React.useRef(null);
	const [status, setStatus] = React.useState<Status>(Status.Login);
	useOnClickOutside(ref_all, () => { props.setLogining(false); });
	switch (status) {
		case Status.Login:
			return <LoginStatus {...props} setStatus={setStatus}/>;
		case Status.ForgetPassword:
			return <ForgetPasswordStatus {...props} setStatus={setStatus}/>;
	}
}

export function SignupModal(props: {setSignuping: (signing: boolean) => void}): JSX.Element {
	let [lawyer_search_result, setLawyerSearchResult] = React.useState<LawyerbcResultMini[]>([]);
	let [lawyer_detail_result, setLawyerDetailResult] = React.useState<LawyerbcResult | null>(null);
	let [selected_search_result_index, setSelectedSearchResult] = React.useState<number>(-1);
	let [user_input, setUserInput] = React.useState<string>('');
	let [message_text, setMessageText] = React.useState<string>('');

	let ref_all = React.useRef(null);
	useOnClickOutside(ref_all, () => props.setSignuping(false));

	async function send_email(email: string, birth_year: number, gender: string, license_id: string): Promise<void> {
		try {
			if (!isEmail(email)) {
				throw '信箱格式異常';
			}
			unwrap(await API_FETCHER.userQuery.recordSignupApply(email, birth_year, gender, license_id, false));
			toast(`申請成功，請至 ${email} 查收認證信`);
		} catch (err) {
			toastErr(err);
		}
		return;
	}

	async function getSearchResult(text: string): Promise<LawyerbcResultMini[]> {
		let result = unwrap_or(await API_FETCHER.userQuery.querySearchResultFromLawyerbc(text), []);
		return result;
	}

	async function handleSelectResult(_: React.ChangeEvent<HTMLElement>, idx: number): Promise<void> {
		setSelectedSearchResult(idx);
		setMessageText('');
		let result = unwrap_or(await API_FETCHER.userQuery.queryDetailResultFromLawyerbc(lawyer_search_result[idx].now_lic_no), null);
		setLawyerDetailResult(result);
	}

	async function handleSearch(): Promise<void> {
		if (user_input.length > 0) {
			let result = await getSearchResult(user_input);
			setLawyerSearchResult(result);
			setLawyerDetailResult(null);
			setSelectedSearchResult(-1);
		} else {
			toast.warn('至少填入一個字才能搜尋');
		}
	}

	const buttons: ModalButton[] = [
		{ text: '送出申請', handler: () => {
			if (lawyer_detail_result) {
				send_email(lawyer_detail_result.email, lawyer_detail_result.birthsday, lawyer_detail_result.sex, lawyer_detail_result.now_lic_no);
				props.setSignuping(false);
			} else {
				setMessageText('請選擇一個搜尋結果');
			}
		}},
		{ text: '清除搜尋結果', handler: () => {
			setUserInput('');
			setMessageText('');
			setLawyerSearchResult([]);
			setLawyerDetailResult(null);
			setSelectedSearchResult(-1);
		}}
	];

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
		if (e.key == 'Enter') {
			handleSearch();
		}
	}

	function getBody(): JSX.Element {
		return <div className={style.signupModal}>
			<div className={style.description}>
				輸入關鍵字後按下查詢，本站將使用法務部律師查詢系統搜尋您的個人資料。
			</div>
			<div className={style.searchBar} >
				<input
					type="text" onChange={(e) => setUserInput(e.target.value)}
					placeholder="😎 姓名/身分證字號/律師證號"
					autoFocus
					onKeyDown={onKeyDown}
					value={user_input} />
				<button onClick={handleSearch}>查詢</button>
			</div>
			<div className={style.searchResult}>
				{lawyer_search_result.length > 0 ? lawyer_search_result.map((result, i) => (
					<div key={result.now_lic_no} className={style.searchResultUnit}>
						<label>
							<input
								key={result.now_lic_no}
								type="radio"
								value={result.now_lic_no}
								checked={selected_search_result_index === i}
								onChange={(event) => handleSelectResult(event, i)}
							/>
							<span>{result.name}, {result.now_lic_no}</span>
						</label>
					</div>
				)) : <div>查無符合結果</div>}
			</div>
			{lawyer_detail_result ? <div className={style.detail} >
				<div>姓名： {lawyer_detail_result.name}</div>
				<div>性別： {lawyer_detail_result.sex}</div>
				<div>證書字號： {lawyer_detail_result.now_lic_no}</div>
				<div>出生年份： {lawyer_detail_result.birthsday}</div>
				<div>電子郵件： {lawyer_detail_result.email}</div>
			</div> : <div className={style.detail}>
				<div>尚未選擇律師資料</div>
			</div>}
			<div className={style.message}>{message_text}</div>
			<div className={style.bottom}>{
				lawyer_detail_result ?
					`送出申請後，碳鍵將寄送認證信至 ${lawyer_detail_result.email}`
					: ''
			}</div>
		</div>;
	}

	return <ModalWindow
		title="註冊"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setSignuping}
	/>;
}