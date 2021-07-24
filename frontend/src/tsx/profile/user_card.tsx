import * as React from 'react';
import { Link } from 'react-router-dom';
import { UserMini } from '../../ts/api/api_trait';
import style from '../../css/user_card.module.css';

function UserCard(props: { user: UserMini }): JSX.Element {
	const url = `/app/user/${props.user.user_name}`;

	return (
		<div className={style.userContainer}>
			<div className={style.userAvatar}>
				<img src={`/avatar/${props.user.user_name}`} />
			</div>
			<div className={style.userDetail}>
				<div className={style.userName}>{props.user.user_name}</div>
				<div className={style.userSentence}>{props.user.sentence}</div>
				<div className={style.userFooter}>
					<div className={style.userFooterItem}>
						☘️<span className={style.num}>{props.user.energy}</span>鍵能
					</div>
				</div>
			</div>
			<Link className={style.overlay} to={url}></Link >
		</div>
	);
}

export {
	UserCard
};