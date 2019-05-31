import * as React from "react";

export type LoginContext = { login: false, setLogin: (user_id: string) => void }
	| { login: true, user_id: string, unsetLogin: () => void };

const Login = React.createContext<LoginContext>({ login: false, setLogin: () => {} });

export {
	Login
};
