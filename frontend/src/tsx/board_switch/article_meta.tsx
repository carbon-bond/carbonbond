import * as React from 'react';
import '../../css/board_switch/article_meta.css';
import { relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';

export function ArticleHeader(props: { user_name: string, board_name: string, date: Date }): JSX.Element {
	const date_string = relativeDate(props.date);
	return <div styleName="articleHeader">
		<Link to={`/app/user/${props.user_name}`}>
			<div styleName="authorId">{props.user_name}</div>
		</Link>
		發佈於
		<Link to={`/app/b/${props.board_name}`}>
			<div styleName="articleBoard">{props.board_name}</div>
		</Link>
		<div styleName="seperationDot">•</div>
		<div styleName="articleTime">{date_string}</div>
	</div>;
}

export function ArticleLine(props: { category_name: string, title: string }): JSX.Element {

	return <div styleName="articleLine">
		<span styleName="articleType">{props.category_name}</span>
		<span styleName="articleTitle">{props.title}</span>
	</div>;
}

export function ArticleFooter(): JSX.Element {
	return <div styleName="articleFooter">
		<div styleName="articleBtns">
			<div styleName="articleBtnItem">
				<i className="material-icons">
					flash_on
				</i>
				<span styleName="num">4218</span>鍵能
			</div>
			<div styleName="articleBtnItem">
				<i className="material-icons">
					question_answer
				</i>
				<span styleName="num">1297</span>則留言
			</div>
			<div styleName="articleBtnItem">
				<i className="material-icons">
					forward
				</i>
				<span styleName="num">18</span>篇大回文
			</div>
			<div styleName="articleBtnItem">
				<i className="material-icons">
					star
				</i>
				收藏
			</div>
			<div styleName="articleBtnItem">
				<i className="material-icons">
					share
				</i>
				分享
			</div>
		</div>
	</div>;
}