import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Article, ArticleMeta } from '../../ts/api/api_trait';
import { ArticleCard } from '../article_card';
import { get_force } from '../../ts/cache';
import * as force_util from '../../ts/force_util';
import { toastErr } from '../utils';
import * as d3 from 'd3';

import '../../css/board_switch/graph_view.css';

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

function edgeColor(energy: number): string {
	if (energy > 0) {
		return 'blue';
	} else if (energy < 0) {
		return 'red';
	} else {
		return 'black';
	}
}

type Node = { id: number, name: string, url: string, radius: number, meta: ArticleMeta };
type Edge = { target: number, source: number, color: string, linknum: number };
type Graph = {
	nodes: Node[],
	edges: Edge[]
};

const width = 600, height = 1200; // XXX: 不要寫死
const base_radius = 30;

type NodeWithXY = { x: number, y: number } & Node;
type ArticleWithNode = {
	article: Article,
	node: NodeWithXY
};

export function GraphViewInner(props: { meta: ArticleMeta }): JSX.Element {
	let [graph, setGraph] = React.useState<Graph | null>(null);
	let [curHovering, setCurHovering] = React.useState<null | ArticleWithNode>(null);
	let [offset_x, setOffsetX] = React.useState(0);
	let [offset_y, setOffsetY] = React.useState(0);
	let [opacity, setOpacity] = React.useState(0);
	let graph_div = React.useRef(null);

	function onHover(node: NodeWithXY): void {
		API_FETCHER.queryArticle(node.id).then(res => {
			try {
				let article = unwrap(res);
				setCurHovering({ node, article });
				setOpacity(0);
				setTimeout(() => {
					setOpacity(100);
				}, 10);
			} catch (err) {
				toastErr(err);
			}
		});
	}

	React.useEffect(() => {
		get_force(props.meta.board_id)
			.then(force => {
				const big_members = force_util.get_big_members(force);
				return API_FETCHER.queryGraph(props.meta.id, big_members).then(res => {
					let g = unwrap(res);
					let counter = new LinkNumCounter();
					setGraph({
						nodes: g.nodes.map(n => {
							return {
								id: n.id,
								url: `/app/b/${n.board_name}/a/${n.id}`,
								name: `[${n.category_name}] ${n.title}`,
								meta: n,
								radius: (Math.random() * 0.75 + 0.25) * base_radius // XXX: 根據鍵能判斷
							};
						}),
						edges: g.edges.map(e => {
							return {
								source: e.from,
								target: e.to,
								color: edgeColor(e.energy),
								linknum: counter.count(e.from, e.to)
							};
						})
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
			.attr('stroke', d => d.color)
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
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
				mouseover(d);
			})
			.on('mouseout', (_, d) => {
				setCurHovering(null);
				mouseout(d);
			});
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
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
				mouseover(d);
			})
			.on('mouseout', (_, d) => {
				setCurHovering(null);
				mouseout(d);
			});

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
				return `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
			});
			link.attr('d', function (d) {
				let curve_inv = 5;
				let homogeneous = 0.2;
				// @ts-ignore
				let pl = this.getTotalLength(), r = d.target.radius + 3,
					m = this.getPointAtLength(pl - r);
				let order = Math.floor(d.linknum / 2);
				// @ts-ignore
				let dx = m.x - d.source.x, dy = m.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy) * (curve_inv * homogeneous) / (order + homogeneous);
				let direction = d.linknum % 2;
				// @ts-ignore
				return `M${d.source.x},${d.source.y} A ${dr} ${dr} 0 0 ${direction} ${m.x} ${m.y}`;
			});
			let min_x = Number.MAX_SAFE_INTEGER, min_y = min_x;
			node.attr('transform', d => {
				// @ts-ignore
				min_x = Math.min(min_x, d.x);
				// @ts-ignore
				min_y = Math.min(min_y, d.y);
				// @ts-ignore
				return 'translate(' + d.x + ',' + d.y + ')';
			});
			let offset_x = base_radius + 10 - min_x;
			let offset_y = base_radius + 10 - min_y;
			// @ts-ignore
			text.attr('transform', d => `translate(${d.x - 10 - d.radius}, ${d.y})`);
			svg.attr('transform', `translate(${offset_x}, ${offset_y})`);
			setOffsetX(offset_x);
			setOffsetY(offset_y);
		}
		simulation.tick(700);
	}, [graph, props.meta.id]);
	if (graph == null) {
		return <></>;
	}
	return <>
		<div ref={graph_div} styleName="svgBlock" style={{ position: 'relative' }}>
			{
				curHovering == null ? null : <div key={curHovering.node.id} style={{
					left: curHovering.node.x + offset_x + curHovering.node.radius,
					top: curHovering.node.y + offset_y + curHovering.node.radius,
					opacity,
				}} styleName="articleBlock">
					<ArticleCard article={curHovering.article}/>
				</div>
			}
		</div>
	</>;
}

function mouseover(d: Node): void {
	d3.select(`#a${d.id}`).transition()
		.duration(400)
		.attr('r', d.radius * 1.3);
}
function mouseout(d: Node): void {
	d3.select(`#a${d.id}`).transition()
		.duration(400)
		.attr('r', d.radius);
}

class LinkNumCounter {
	private map: { [index: string]: number };
	constructor() {
		this.map = {};
	}
	count(node1: number, node2: number): number {
		if (node1 > node2) {
			return this.count(node2, node1);
		}
		let key = `${node1}-${node2}`;
		let cnt = (this.map[key] | 0) + 1;
		this.map[key] = cnt;
		return cnt;
	}
}