import * as React from 'react';
import { Link } from 'react-router-dom';
import { UserMini } from '../../ts/api/api_trait';
import { Avatar } from './avatar';
import '../../css/user_card.css';

function UserCard(props: { user: UserMini }): JSX.Element {
	const url = `/app/user/${props.user.user_name}`;

	return (
		<div styleName="userContainer">
			<div styleName="userAvatar">
				<Avatar is_me={false} name={props.user.user_name} />
			</div>
			<div styleName="userDetail">
				<div styleName="userName">{props.user.user_name}</div>
				<div styleName="userSentence">{props.user.sentence}</div>
				<div styleName="userFooter">
					<div styleName="userFooterItem">
						☘️<span styleName="num">{props.user.energy}</span>鍵能
					</div>
				</div>
			</div>
			<Link styleName="overlay" to={url}></Link >
		</div>
	);
}

export {
	UserCard
};