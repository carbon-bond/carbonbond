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
		return <GraphViewInner meta={article_meta} />;
	} else {
		return <></>;
	}
}

type Node = { id: number, name: string, url: string, radius: number };
type Graph = {
	nodes: Node[],
	edges: { target: number, source: number }[]
};

const width = 1200, height = 1200; // XXX: 不要寫死
const base_radius = 30;

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
								name: `[${n.category_name}] ${n.title}`,
								radius: (Math.random() * 0.75 + 0.25) * base_radius // XXX: 根據鍵能判斷
							};
						}),
						edges: g.edges.map(e => { return { source: e[1], target: e[0] }; })
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

		let link = svg.append('g')
			.selectAll('path')
			.data(graph.edges)
			.enter()
			.append('path')
			.attr('fill', 'none')
			.attr('stroke', 'black')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrow)');

		let node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('g')
			.data(graph.nodes)
			.enter()
			.append('svg:a')
			.attr('xlink:href', d => d.url)
			.append('circle')
			.style('fill', '#69b3a2')
			.attr('id', d => 'a' + d.id)
			.attr('r', d => d.radius)
			.on('mouseover', mouseover)
			.on('mouseout',  mouseout);
		d3.select(`#a${props.meta.id}`).style('fill', 'pink');

		let text = svg.append('g')
			.selectAll('text')
			.data(graph.nodes)
			.enter()
			.append('svg:a')
			.attr('xlink:href', d => d.url)
			.append('text')
			.text(function (d) {
				return d.name;
			})
			.on('mouseover', mouseover)
			.on('mouseout',  mouseout);

		svg.append('defs')
			.append('marker')
			.attr('id', 'arrow')
			.attr('markerUnits', 'strokeWidth')
			.attr('markerWidth', 12)
			.attr('markerHeight', 12)
			.attr('viewBox', '0 0 12 12')
			.attr('refX', 3)
			.attr('refY', 3)
			.attr('orient', 'auto')
			.append('path')
			.attr('stroke', 'none')
			.attr('d', 'M1,1 L5,3 L1,5 Z')
			.attr('fill', '#000');

		// @ts-ignore
		let simulation = d3.forceSimulation(graph.nodes)
			.force('link', d3.forceLink()
				.links(graph.edges)
				// @ts-ignore
				.id(d => d.id)
			)
			.force('charge', d3.forceManyBody().strength(-2000))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.on('end', ticked);

		function ticked(): void {
			link.attr('d', function (d) {
				// @ts-ignore
				let dx = d.target.x - d.source.x, dy = d.target.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy);
				// @ts-ignore
				return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
			});
			link.attr('d', function (d) {
				// @ts-ignore
				let pl = this.getTotalLength(), r = d.target.radius + 3,
					m = this.getPointAtLength(pl - r);
				// @ts-ignore
				let dx = m.x - d.source.x, dy = m.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy);
				// @ts-ignore
				return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + m.x + ',' + m.y;
			});
			let min_x = Number.MAX_SAFE_INTEGER, min_y = min_x;
			node.attr('transform', d =>{
				// @ts-ignore
				min_x = Math.min(min_x, d.x);
				// @ts-ignore
				min_y = Math.min(min_y, d.y);
				// @ts-ignore
				return 'translate(' + d.x + ',' + d.y + ')';
			});
			// @ts-ignore
			text.attr('transform', d => `translate(${d.x - 10 - d.radius}, ${d.y})`);
			svg.attr('transform', `translate(${base_radius + 10 - min_x}, ${base_radius + 10 - min_y})`);
		}
		simulation.tick(700);
	}, [graph, props.meta.id]);
	if (graph == null) {
		return <></>;
	}
	return <>
		<div ref={graph_div}></div>
	</>;
}

// eslint-disable-next-line
function mouseover(_evt: any, d: Node): void {
	d3.select(`#a${d.id}`).transition()
		.duration(400)
		.attr('r', d.radius * 1.3);
}
// eslint-disable-next-line
function mouseout(_evt: any, d: Node): void {
	d3.select(`#a${d.id}`).transition()
		.duration(400)
		.attr('r', d.radius);
}