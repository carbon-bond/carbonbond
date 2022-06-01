import * as React from 'react';
import { Link } from 'react-router-dom';

import { API_FETCHER, unwrap, unwrap_or } from '../ts/api/api';
import { UserState } from './global_state/user';
import { SignupInvitation, SignupInvitationCredit } from '../ts/api/api_trait';
import { useForm } from 'react-hook-form';

import { toastErr } from './utils';

import style from '../css/signup_invitation_page.module.css';
import { toast } from 'react-toastify';
import { LocationState, SimpleLocation } from './global_state/location';

async function fetchInvitationList(): Promise<SignupInvitation[]> {
	return unwrap_or(await API_FETCHER.userQuery.querySignupInvitationList(), []);
}

async function fetchCreditList(): Promise<SignupInvitationCredit[]> {
	return unwrap_or(await API_FETCHER.userQuery.querySignupInvitationCreditList(), []);
}

function CreditList(props: { credits: SignupInvitationCredit[], total: number }): JSX.Element {
	let { credits, total } = props;

	return <div className={style.creditList}>
		<div className={style.title}>共獲得邀請碼 {total} 張</div>
		{
			credits.map((credit) => (
				<div className={style.credit} key={credit.id}>
					<span>{credit.event_name}</span>
					<span> {credit.credit}</span>
				</div>
			))
		}
	</div>;
}

function InviteList(props: { invitations: SignupInvitation[] }): JSX.Element {
	const { invitations } = props;

	return <div className={style.invitationList}>
		<div className={style.title}>已使用 {invitations.length} 張</div>
		{
			invitations.map((invitation) => (
				<div className={style.invitation} key={`${invitation.email}`}>
					<span className={style.email}>{invitation.email} </span>
					{
						invitation.user_name == undefined ?
							'尚未完成註冊，或者已經更換信箱'
							: <Link to={`/app/user/${invitation.user_name}`}>
								{invitation.user_name}
							</Link>
					}
				</div>
			))
		}
	</div>;
}

function InvitationInput(props: {setRerun: Function, remaining: number}): JSX.Element {
	type Input = {
		email: string,
	};
	const { register, handleSubmit, reset } = useForm<Input>();
	const onSubmit = (data: Input): void => {
		API_FETCHER.userQuery.sendSignupEmail(data.email, true)
		.then((result) => {
			unwrap(result);
			toast('已送出邀請信！');
			props.setRerun((x: number) => x + 1);
		})
		.catch(err => toastErr(err));
		reset({email: ''});
	};
	return <div>
		<div className={style.title}> 剩下 {props.remaining} 邀請碼 </div>
		{
			props.remaining > 0 ?
				<form onSubmit={handleSubmit(onSubmit)}>
					<span>邀請 </span>
					<input ref={register} type="email" name="email" placeholder="輸入 email" />
				</form> :
				null
		}
	</div>;
}

export function SignupInvitationPage(): JSX.Element {
	let { user_state } = UserState.useContainer();
	let [rerun, setRerun] = React.useState<number>(0);
	let [invitations, setInvitations] = React.useState<SignupInvitation[]>([]);
	let [credits, setCredits] = React.useState<SignupInvitationCredit[]>([]);

	const { setCurrentLocation } = LocationState.useContainer();
	React.useEffect(() => {
		setCurrentLocation(new SimpleLocation('我的邀請碼'));
	}, [setCurrentLocation]);

	React.useEffect(() => {
		if (user_state.login) {
			fetchInvitationList().then(invitation_list => {
				setInvitations(invitation_list);
			}).catch(err => toastErr(err));
			fetchCreditList().then(credit_list => {
				setCredits(credit_list);
			}).catch(err => toastErr(err));
		}
	}, [user_state, rerun]);

	const total_credit = credits.reduce((sum, credit) => {
		return sum + credit.credit;
	}, 0);

	return <>
		<InvitationInput setRerun={setRerun} remaining={total_credit - invitations.length}/>
		<CreditList credits={credits} total={total_credit}/>
		<InviteList invitations={invitations}/>
	</>;
}