import * as React from "react";
type LoginState = { login: false } | { login: true, user_id: string };
const LoginContext = React.createContext<LoginState>({ login: false }); 

export {
    LoginState, LoginContext
}
