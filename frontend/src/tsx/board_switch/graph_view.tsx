import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { Article, ArticleMeta } from '../../ts/api/api_trait';
import { ArticleCard } from '../article_card';
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
		return <GraphViewInner meta={article_meta} {...props} />;
	} else {
		return <></>;
	}
}

let NODE_OPACITY = 0.9;
let NODE_OPACITY_DIM = 0.3;
let GREY = 'rgb(80, 80, 80)';
let GREEN = '#69b3a2';
let FONT_SIZE = 12;

function edgeColor(energy: number): string {
	if (energy > 0) {
		return 'blue';
	} else if (energy < 0) {
		return 'red';
	} else {
		return GREY;
	}
}

type Node = { id: number, name: string, url: string, radius: number, meta: ArticleMeta };
type Edge = { target: number, source: number, color: string, linknum: number };
type EdgeMap = { [from: number]: { [to: number]: boolean } };
type Graph = {
	nodes: Node[],
	edges: Edge[],
	edge_map: EdgeMap
};

const base_radius = 30;

type NodeWithXY = { x: number, y: number } & Node;
type ArticleWithNode = {
	article: Article,
	node: NodeWithXY
};

function hasRelation(graph: Graph, n1: number, n2: number, second_chance?: boolean): boolean {
	if (n1 == n2) {
		return true;
	}
	let map = graph.edge_map;
	let inner = map[n1];
	if (inner) {
		if (inner[n2]) {
			return true;
		}
	}
	if (!second_chance) {
		return hasRelation(graph, n2, n1, true);
	} else {
		return false;
	}
}
function getHighlighted(graph: Graph | null, center: Node): { [id: number]: boolean } {
	let highlighted: { [id: number]: boolean } = {};
	if (graph == null) {
		return highlighted;
	}
	for (let n of graph.nodes) {
		if (hasRelation(graph, center.id, n.id)) {
			highlighted[n.id] = true;
		}
	}
	return highlighted;
}
function buildEdgeMap(edges: Edge[]): EdgeMap {
	let map: EdgeMap = {};
	for (let e of edges) {
		if (!(e.source in map)) {
			map[e.source] = {};
		}
		map[e.source][e.target] = true;
	}
	return map;
}

export function GraphViewInner(props: { meta: ArticleMeta } & RouteComponentProps ): JSX.Element {
	let [graph, setGraph] = React.useState<Graph | null>(null);
	let [cur_hovering, setCurHovering] = React.useState<null | ArticleWithNode>(null);
	let [offset_x, setOffsetX] = React.useState(0);
	let [offset_y, setOffsetY] = React.useState(0);
	let [init_offset_x, setInitOffsetX] = React.useState(0);
	let [init_offset_y, setInitOffsetY] = React.useState(0);
	let [scale, setScale] = React.useState(1);
	let [opacity, setOpacity] = React.useState(0);
	let graph_div = React.useRef<HTMLDivElement | null>(null);

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
		API_FETCHER.queryGraph(props.meta.id, null, { BlackList: [force_util.SMALL] }).then(res => {
			let g = unwrap(res);
			let counter = new LinkNumCounter();
			let nodes = g.nodes.map(n => {
				return {
					id: n.id,
					url: `/app/b/${n.board_name}/a/${n.id}`,
					name: `[${n.category_name}] ${n.title}`,
					meta: n,
					radius: (Math.random() * 0.75 + 0.25) * base_radius // XXX: 根據鍵能判斷
				};
			});
			let edges = g.edges.map(e => {
				return {
					source: e.from,
					target: e.to,
					color: edgeColor(e.energy),
					linknum: counter.count(e.from, e.to)
				};
			});
			setGraph({ nodes, edges, edge_map: buildEdgeMap(edges) });
		}).catch(err => {
			toastErr(err);
		});
	}, [props.meta]);
	React.useEffect(() => {
		if (graph == null || graph_div.current == null) {
			return;
		}
		let width = graph_div.current.offsetWidth;
		let full_height = document.getElementsByTagName('body')[0].clientHeight;
		let height = full_height - computeOffsetTop(graph_div.current);

		let svg_super = d3.select(graph_div.current).append('svg')
			.attr('width', width)
			.attr('height', height);

		let svg = makeZoomable(svg_super, (t) => {
			setOffsetX(t.offset_x);
			setOffsetY(t.offset_y);
			setScale(t.scale);
		}).attr('id', 'canvas');

		let link = svg.append('g')
			.selectAll('path')
			.data(graph.edges)
			.enter()
			.append('path')
			.attr('fill', 'none')
			.attr('stroke', d => d.color)
			.attr('stroke-width', 2)
			.style('stroke', GREEN)
			.attr('opacity', 0.5)
			.attr('marker-end', 'url(#arrow)');

		let node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('g')
			.data(graph.nodes)
			.enter()
			.append('circle')
			.style('fill', GREEN)
			.style('opacity', NODE_OPACITY)
			.style('cursor', 'pointer')
			.attr('id', d => 'a' + d.id)
			.attr('r', d => d.radius)
			.on('mousedown', (_, d) => {
				props.history.push(d.url);
			})
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
			})
			.on('mouseout', () => setCurHovering(null));
		d3.select(`#a${props.meta.id}`).style('fill', '#d34c4c');

		let text = svg.append('g')
			.selectAll('text')
			.data(graph.nodes)
			.enter()
			.append('text')
			.attr('fill', GREY)
			.style('cursor', 'pointer')
			.style('font-size', FONT_SIZE)
			.text(function (d) {
				return d.name;
			})
			.on('mousedown', (_, d) => {
				props.history.push(d.url);
			})
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
			})
			.on('mouseout', () => setCurHovering(null));

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
			.attr('fill', GREEN);

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
				let pl = this.getTotalLength();
				// @ts-ignore
				let m = this.getPointAtLength(pl - d.target.radius), s = this.getPointAtLength(d.source.radius);
				let order = Math.floor(d.linknum / 2);
				// @ts-ignore
				let dx = m.x - d.source.x, dy = m.y - d.source.y,
					dr = Math.sqrt(dx * dx + dy * dy) * (curve_inv * homogeneous) / (order + homogeneous);
				let direction = d.linknum % 2;
				// @ts-ignore
				return `M${s.x},${s.y} A ${dr} ${dr} 0 0 ${direction} ${m.x} ${m.y}`;
			});
			let offset_x = 0, offset_y = 0;
			node.attr('transform', d => {
				if (props.meta.id == d.id) {
					// @ts-ignore
					let [x, y, diameter] = [d.x, d.y, d.radius * 2];
					// 避免當前文章跑出畫面外
					if (x - diameter < 0) {
						offset_x = -x + diameter;
					} else if (x + diameter > width) {
						offset_x = width - x - diameter;
					}
					if (y - diameter < 0) {
						offset_y = -y + diameter;
					} else if (y + diameter > height) {
						offset_y = height - y - diameter;
					}
				}
				// @ts-ignore
				return 'translate(' + d.x + ',' + d.y + ')';
			});
			text.attr('transform', function (d) {
				let len = this.getComputedTextLength();
				// @ts-ignore
				return `translate(${d.x - len/2}, ${d.y + d.radius + FONT_SIZE})`;
			});

			svg.attr('transform', `translate(${offset_x}, ${offset_y})`);
			setInitOffsetX(offset_x);
			setInitOffsetY(offset_y);
		}
		simulation.tick(700);
	}, [graph, props.meta.id, props.history]);

	React.useEffect(() => {
		d3.select('#canvas')
		.transition()
		.duration(50)
		.attr('transform', `translate(${offset_x + init_offset_x * scale}, ${offset_y + init_offset_y * scale})scale(${scale})`);
	}, [init_offset_x, init_offset_y, offset_x, offset_y, scale]);

	React.useEffect(() => {
		if (graph == null) {
			return;
		}
		if (cur_hovering == null) {
			// TODO:
			for (let node of graph.nodes) {
				d3.select(`#a${node.id}`).transition()
					.duration(400)
					.attr('r', node.radius)
					.style('opacity', NODE_OPACITY);
			}
		} else {
			let highlighted = getHighlighted(graph, cur_hovering.node);
			for (let node of graph.nodes) {
				if (highlighted[node.id]) {
					d3.select(`#a${node.id}`).transition()
						.duration(400)
						.attr('r', node.radius * 1.2)
						.style('opacity', 1);
				} else {
					d3.select(`#a${node.id}`).transition()
						.duration(400)
						.style('opacity', NODE_OPACITY_DIM);
				}
			}
		}
	}, [cur_hovering, graph]);

	if (graph == null) {
		return <></>;
	}
	return <>
		<div ref={graph_div} styleName="svgBlock" style={{ position: 'relative' }}>
			{
				cur_hovering == null ? null : <div key={cur_hovering.node.id} style={{
					left: (cur_hovering.node.x + cur_hovering.node.radius + init_offset_x) * scale + offset_x,
					top: (cur_hovering.node.y + cur_hovering.node.radius + init_offset_y) * scale + offset_y,
					opacity,
				}} styleName="articleBlock">
					<ArticleCard article={cur_hovering.article} />
				</div>
			}
		</div>
	</>;
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

function makeZoomable(
	svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
	onTransform: (t: { offset_x: number, offset_y: number, scale: number }) => void
): d3.Selection<SVGGElement, unknown, null, undefined> {
	let g = svg.append('g');
	let speed = 1;
	let zoom = d3.zoom()
		.scaleExtent([0.5, 5])
		.on('zoom', function (event) {
			let scale = event.transform.k * speed + (1 - speed);
			let t = event.transform;
			onTransform({
				offset_x: t.x * (speed),
				offset_y: t.y * (speed),
				scale,
			});
		});
	// @ts-ignore
	svg.call(zoom);
	return g;
}

function computeOffsetTop(elt: HTMLElement | null): number {
	let offsetTop = 0;
	while (elt) {
		offsetTop += elt.offsetTop;
		let e = elt.offsetParent;
		if (e && 'offsetTop' in e) {
			elt = e;
		} else {
			break;
		}
	}
	return offsetTop;
}
