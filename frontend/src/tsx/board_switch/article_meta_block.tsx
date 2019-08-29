import * as React from 'react';
import '../../css/article_meta.css';
import { relativeDate } from '../../ts/date';
import { Link } from 'react-router-dom';
import { Article, ArticleMeta } from '.';
import { getArticleCategory } from '../../ts/forum_util';

function Title(props: { title: string }): JSX.Element {
	if (props.title.length > 20) { // TODO: 這裡應該看實際顯示長度
		return <pre styleName="titleLong">{props.title}</pre>;
	} else {
		return <pre styleName="title">{props.title}</pre>;
	}
}

export function ArticleMetaBlock(props: { article: ArticleMeta | Article }): JSX.Element {
	let article = props.article;
	let category = getArticleCategory(article);
	return <div styleName="articleMeta">
		<div styleName="txtMeta">
			<div styleName="cName">{category.name}</div>
			<div styleName="authorDate">
				<Link styleName="author" to={`/app/u/${article.author.userName}`}>{article.author.userName}</Link>
				&nbsp;發表於{relativeDate(new Date(article.createTime))}
			</div>
			<Title title={article.title} />
		</div>
		<div styleName="numMeta">
			<div>⚡ {article.energy}</div>
			<div> 💬 12 </div>
			<div> 🔥 12 </div>
		</div>
	</div>;
}