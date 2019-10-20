import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { ArticleCard, ArticleMeta } from './article_meta';
import { ajaxOperation } from '../ts/api';

import '../css/user_page.css';

const PAGE_SIZE: number = 10;

async function fetchArticles(
	author_name: string,
	page_size: number,
	before: string | null
): Promise<ArticleMeta[]> {
	let res = await ajaxOperation.ArticleList({ author_name, page_size, before, show_hidden: false });
	return res.articleList;
}

type Props = RouteComponentProps<{ user_name: string }>;

function UserPage(props: Props): JSX.Element {
	const user_name = props.match.params.user_name;

	const [articles, setArticles] = React.useState<ArticleMeta[]>([]);
	// TODO: 分頁
	// const [is_end, set_is_end] = React.useState<boolean>(false);

	React.useEffect(() => {
		fetchArticles(user_name, PAGE_SIZE, null).then(more_articles => {
			console.log(more_articles);
			setArticles(more_articles);
		});
	}, [user_name]);

	return <div>
		<div styleName="up">
			<div styleName="avatar"></div>
			<div styleName="abstract">
				<div styleName="username">{user_name}</div>
				<div styleName="sentence">那一天我二十一歲，在我一生的黃金時代。</div>
				<div styleName="data">
					<div styleName="energy">9.8 萬 鍵能</div>
					<div styleName="trace">8425 追蹤</div>
					<div styleName="hate">17 仇視</div>
				</div>
			</div>
			<div styleName="links">
				<div styleName="relation">
					<button>追蹤</button>
					<button>仇視</button>
				</div>
				<a href={`/app/user_board/${user_name}`}>個板</a>
				<a>私訊</a>
			</div>
		</div>
		<div styleName="down">
			<div styleName="works">
				{
					articles.map((article, idx) => (
						<div styleName="articleWrapper" key={`article-${idx}`}>
							<ArticleCard article={article} />
						</div>
					))
				}
			</div>
			<div styleName="detail">
				<div styleName="intro">
					我討厭胡蘿蔔
				</div>
				<div styleName="info">
					現居 高雄
				</div>
				<div styleName="achivement">
					曾獲 193 次收藏
				</div>
			</div>
		</div>
	</div>;
}

export {
	UserPage
};