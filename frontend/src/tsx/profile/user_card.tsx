import * as React from 'react';
import { Link } from 'react-router-dom';
import { UserMini } from '../../ts/api/api_trait';
import '../../css/user_card.css';

function UserCard(props: { user: UserMini }): JSX.Element {
	const url = `/app/user/${props.user.user_name}`;

	return (
		<div className="userContainer">
			<div className="userAvatar">
				<img src={`/avatar/${props.user.user_name}`} />
			</div>
			<div className="userDetail">
				<div className="userName">{props.user.user_name}</div>
				<div className="userSentence">{props.user.sentence}</div>
				<div className="userFooter">
					<div className="userFooterItem">
						☘️<span className="num">{props.user.energy}</span>鍵能
					</div>
				</div>
			</div>
			<Link className="overlay" to={url}></Link >
		</div>
	);
}

export {
	UserCard
};