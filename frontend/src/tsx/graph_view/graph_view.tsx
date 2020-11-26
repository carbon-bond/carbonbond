import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleMeta } from '../../ts/api/api_trait';
import { get_force } from '../../ts/cache';
import * as force_util from '../../ts/force_util';
import { toastErr } from '../utils';

type Props = RouteComponentProps<{ article_id: string }>;

export function GraphView(props: Props): JSX.Element {
	let article_id = parseInt(props.match.params.article_id);
	let [article_meta, setArticleMeta] = React.useState<ArticleMeta | null>(null);
	React.useEffect(() => {
		if (Number.isNaN(article_id)) {
			toastErr(`${props.match.params.article_id} 不是合法的文章 id`);
			return;
		}
		API_FETCHER.queryArticleMeta(article_id).then(res => {
			if ('Err' in res) {
				toastErr(res.Err);
			} else {
				setArticleMeta(res.Ok);
			}
		});
	}, [article_id, props.match.params.article_id]);
	if (article_meta) {
		return <GraphViewInner meta={article_meta}/>;
	} else {
		return <></>;
	}
}

export function GraphViewInner(props: { meta: ArticleMeta }): JSX.Element {
	let [graph, setGraph] = React.useState(new Array<ArticleMeta>());
	React.useEffect(() => {
		get_force(props.meta.board_id)
            .then(force => {
            	const big_members = force_util.get_big_members(force);
            	return API_FETCHER.queryGraph(props.meta.id, big_members).then(res => {
            		let graph = unwrap(res);
            		setGraph(graph);
            	});
            }).catch(err => {
            	toastErr(err);
            });
	}, [props.meta]);
	return <>
        {
        	graph.map(article => {
        		return <div>{JSON.stringify(article)}</div>;
        	})
        }
    </>;
}