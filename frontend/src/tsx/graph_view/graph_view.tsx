import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleMeta } from '../../ts/api/api_trait';
import { get_force } from '../../ts/cache';
import * as force_util from '../../ts/force_util';
import { toastErr } from '../utils';
import * as d3 from 'd3';

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

type Graph = {
	nodes: { id: number, name: string, url: string }[],
	edges: { target: number, source: number }[]
};

const width = 700, height = 900;

export function GraphViewInner(props: { meta: ArticleMeta }): JSX.Element {
	let [graph, setGraph] = React.useState<Graph | null>(null);
	let graph_div = React.useRef(null);
	React.useEffect(() => {
		get_force(props.meta.board_id)
            .then(force => {
            	const big_members = force_util.get_big_members(force);
            	return API_FETCHER.queryGraph(props.meta.id, big_members).then(res => {
            		let g = unwrap(res);
            		setGraph({
            			nodes: g.nodes.map(n => {
            				return {
            					id: n.id,
            					url: `/app/b/${n.board_name}/a/${n.id}`,
            					name: `[${n.category_name}] ${n.title}`
            				};
            			}),
            			edges: g.edges.map(e => { return { source: e[0], target: e[1] }; })
            		});
            	});
            }).catch(err => {
            	toastErr(err);
            });
	}, [props.meta]);
	React.useEffect(() => {
		if (graph == null) {
			return;
		}
		let svg = d3.select(graph_div.current).append('svg')
			.attr('width', width)
			.attr('height', height);

		let node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('g')
			.data(graph.nodes)
			.enter()
			.append('svg:a')
			.attr('xlink:href', d => d.url);

		node.append('circle')
			.attr('r', 20)
			.style('fill', '#69b3a2');

		node.append('text')
			.text(function (d) {
				return d.name;
			})
			.attr('x', 6)
			.attr('y', 3);

		// svg
		// 	.append("svg:defs")
		// 	.append("svg:marker")
		// 	.attr("id", "triangle")
		// 	.attr("refX", 15)
		// 	.attr("refY", -1.5)
		// 	.attr("markerWidth", 6)
		// 	.attr("markerHeight", 6)
		// 	.attr("orient", "auto")
		// 	.append("path")
		// 	.attr("d", "M 0 -5 10 10")
		// 	.style("stroke", "black");

		let link = svg.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(graph.edges)
			.enter()
			.append('line')
			.style('stroke', '#aaa');

		d3.forceSimulation(graph.nodes)
			.force('link', d3.forceLink()
				.id(d => d.id)
				.links(graph.edges)
			)
			.force('charge', d3.forceManyBody().strength(-700))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.on('tick', ticked);

		function ticked(): void {
			link
				.attr('x1', function (d) { return d.source.x; })
				.attr('y1', function (d) { return d.source.y; })
				.attr('x2', function (d) { return d.target.x; })
				.attr('y2', function (d) { return d.target.y; });

			node.attr('transform', function (d) {
				return 'translate(' + d.x + ',' + d.y + ')';
			});
		}
	}, [graph]);
	if (graph == null) {
		return <></>;
	}
	return <>
		<div ref={graph_div}></div>
	</>;
}