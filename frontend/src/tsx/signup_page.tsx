import * as React from 'react';
import { toast } from 'react-toastify';
import { RouteComponentProps } from 'react-router';
import { extractErrMsg, ajaxOperation, GQL } from '../ts/api';
import { useInputValue } from './utils';
import '../css/signup_page.css';

type Props = RouteComponentProps<{ invite_code?: string }>;
type Invitation = GQL.Invitation;

async function fetchInvitation(invite_code: string): Promise<Invitation> {
	let res = await ajaxOperation.Invitation({code: invite_code});
	return res.invitation;
}

export function SignupPage(props: Props): JSX.Element {
	let name = useInputValue('').input_props;
	let password = useInputValue('').input_props;
	let repeated_password = useInputValue('').input_props;
	let [invitation, setInvitation] = React.useState<Invitation | null>(null);

	async function signup_request(code: string, name: string, password: string): Promise<{}> {
		try {
			await ajaxOperation.Signup({ code, name, password });
			props.history.push('/app/');
			toast('註冊成功');

		} catch (err) {
			toast.error(extractErrMsg(err));
		}
		return {};
	}

	function signup_check(code: string, name: string, password: string, repeated_password: string): {} {
		if (password === repeated_password){
			signup_request(code, name, password);
		}
		else {
			toast.error('密碼與確認密碼不一致！');
		}
		return {};
	}

	let getInviteCode = React.useCallback(() => {
		let code = props.match.params.invite_code;
		if (typeof code == 'string') {
			return code;
		} else {
			throw '找不到邀請碼';
		}
	}, [props.match.params.invite_code]);

	React.useEffect(() => {
		let invite_code = getInviteCode();
		fetchInvitation(invite_code).then(invitation => {
			setInvitation(invitation);
		}).catch(err => console.log(err));
	}, [getInviteCode]);

	if (invitation) {
		if (invitation.isUsed){
			return <div styleName="signupPage">
				<div styleName="signupForm">
					<div styleName="counter">抱歉！ {invitation.inviteeEmail} 此信箱已經註冊過了</div>
				</div>
			</div>;
		} else {
			return <div styleName="signupPage">
				<div styleName="signupForm">
					<div styleName="counter">這封邀請信是　{invitation.inviterName}　寄給你的</div>
					<div styleName="counter">他說：　{invitation.words}　</div>
					<div styleName="counter">你的email是：　{invitation.inviteeEmail}　</div>
					<input styleName="username" type="text" placeholder="使用者名稱" {...name} autoFocus />
					<input styleName="password" type="password" placeholder="密碼" {...password} autoFocus />
					<input styleName="password" type="password" placeholder="確認密碼" {...repeated_password} autoFocus />
					<button onClick={ () => signup_check(invitation!.code, name.value, password.value, repeated_password.value) }>註冊帳號</button>
				</div>
			</div>;
		}
	} else {
		return <div styleName="signupPage">
			<div styleName="signupForm">
				<div styleName="counter">找不到邀請碼</div>
			</div>
		</div>;
	}
}