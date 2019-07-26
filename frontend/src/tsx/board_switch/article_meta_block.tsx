import * as React from 'react';
import { ArticleMeta, Article, isMeta } from '.';
import '../../css/article_meta.css';
import { formatCreateDate } from '../../ts/date';
import { Link } from 'react-router-dom';

function Title(props: { title: string }): JSX.Element {
	if (props.title.length > 20) { // TODO: 這裡應該看實際顯示長度
		return <div styleName='titleLong'>{props.title}</div>;
	} else {
		return <div styleName='title'>{props.title}</div>;
	}
}

export function ArticleMetaBlock(props: { article: ArticleMeta | Article }): JSX.Element {
	let article = props.article;
	return <div styleName='articleMeta'>
		<div styleName='txtMeta'>
			{
				isMeta(article) ?
					<div styleName='cName'>{article.categoryName}</div>
					: <div styleName='cName'>{article.category.name}</div>
			}
			<div styleName='authorDate'>
				<Link styleName='author' to={`/app/u/${article.authorId}`}>{article.authorId}</Link>
				&nbsp;發表於{formatCreateDate(article.createTime)}
			</div>
			<Title title={article.title} />
		</div>
		<div styleName='numMeta'>
			<div>⚡ {article.energy}</div>
			<div> 💬 12 </div>
			<div> 🔥 12 </div>
		</div>
	</div>;
}