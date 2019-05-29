import * as React from "react";

import { LoginContext, Login, RouteComponentProps } from "./types";

type Props = RouteComponentProps<{ invite_code: string }>;

export class RegisterPage extends React.Component<Props, {}, LoginContext> {
	getInviteCode() {
		let code = this.props.match.params.invite_code;
		if (typeof code == "string") {
			return code;
		} else {
			throw "找不到邀請碼";
		}
	}
	componentDidMount() {
		// let code = this.getInviteCode();
		// 問後端此邀請碼的信箱
		console.log(this.props);
		if (this.context.login) {
			// 跳轉回首頁
			this.props.history.replace("/app");
		}
	}
	render() {
		return <div>
			註冊頁
		</div>;
	}
}
RegisterPage.contextType = Login;