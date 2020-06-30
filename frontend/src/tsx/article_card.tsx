import * as React from 'react';
import '../css/board_switch/article_card.css';
import { relativeDate } from '../ts/date';
import { Link } from 'react-router-dom';
import { GQL } from '../ts/api';

export type ArticleMeta = GQL.ArticleMetaFragment;

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

function ArticleCard(props: { article: ArticleMeta }): JSX.Element {

	const date = new Date(props.article.createTime);
	let user_name = '';
	let category_name = '';
	try {
		user_name = props.article.author.userName;
		category_name = JSON.parse(props.article.category.body).name;
	} catch {
		user_name = '未知';
		category_name = '未知';
	}

	return (
		<Link to={`/app/b/${props.article.board.boardName}/a/${props.article.id}`}>
			<div styleName="articleContainer">
				<ArticleHeader user_name={user_name} board_name={props.article.board.boardName} date={date} />
				<div styleName="articleBody">
					<div styleName="leftPart">
						<ArticleLine category_name={category_name} title={props.article.title} />
						<div styleName="articleContent">
							{props.article.content}
						</div>
					</div>
				</div>
				<ArticleFooter />
			</div>
		</Link >
	);
}

export {
	ArticleCard
};