import * as React from "react";

import { Login, RouteComponentProps } from "./types";

type Props = RouteComponentProps<{ invite_code: string }>;

export function RegisterPage(props: Props) {
	let getInviteCode = React.useCallback(() => {
		let code = props.match.params.invite_code;
		if (typeof code == "string") {
			return code;
		} else {
			throw "找不到邀請碼";
		}
	}, [props.match.params.invite_code]);
	let context = React.useContext(Login);
	React.useEffect(() => {
		let code = getInviteCode();
		// 問後端此邀請碼的信箱
		console.log(context, code);
		if (context.login) {
			// 跳轉回首頁
			props.history.replace("/app");
		}
	}, [getInviteCode]);
	return <div> 註冊頁 </div>;
}