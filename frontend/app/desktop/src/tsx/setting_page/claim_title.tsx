import * as React from 'react';
import { LawyerbcResult, LawyerbcResultMini } from 'carbonbond-api/api_trait';
import { API_FETCHER, unwrap_or, unwrap } from 'carbonbond-api/api_utils';
import useOnClickOutside from 'use-onclickoutside';
import { isEmail } from '../../ts/regex_util';
import { toast } from 'react-toastify';
import { toastErr } from '../utils';
import { ModalButton, ModalWindow } from '../components/modal_window';
import style from '../../css/header/login_modal.module.css';

export function ClaimLawerTitle(props: {setSignuping: (signing: boolean) => void}): JSX.Element {
	let [lawyer_search_result, setLawyerSearchResult] = React.useState<LawyerbcResultMini[]>([]);
	let [lawyer_detail_result, setLawyerDetailResult] = React.useState<LawyerbcResult | null>(null);
	let [selected_search_result_index, setSelectedSearchResult] = React.useState<number>(-1);
	let [user_input, setUserInput] = React.useState<string>('');
	let [message_text, setMessageText] = React.useState<string>('');

	let ref_all = React.useRef(null);
	useOnClickOutside(ref_all, () => props.setSignuping(false));

	async function send_email(email: string, license_id: string): Promise<void> {
		try {
			if (!isEmail(email)) {
				throw '信箱格式異常';
			}
			unwrap(await API_FETCHER.userQuery.claimTitle({Lawer: { license_id }}));
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
				send_email(lawyer_detail_result.email, lawyer_detail_result.now_lic_no);
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
		if (e.keyCode == 13) {
			handleSearch();
		}
	}

	function getBody(): JSX.Element {
		return <div className={style.claimTitleModal}>
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
		title="申請驗證"
		body={getBody()}
		buttons={buttons}
		visible={true}
		setVisible={props.setSignuping}
	/>;
}