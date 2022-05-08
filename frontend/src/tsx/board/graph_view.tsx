import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { API_FETCHER, unwrap } from '../../ts/api/api';
import { ArticleMeta } from '../../ts/api/api_trait';
import { ArticleCard } from '../article_card';
import { toastErr } from '../utils';
import * as d3 from 'd3';

import style from '../../css/board/graph_view.module.css';
import { getBoardInfo } from '.';

enum RadiusMode {
	Energy,
	AbsEnergy,
	CommentNumber,
};
type Panel = {
	radius_mode: RadiusMode,
	locate: boolean,
	unlocate: () => void
};

export function GraphPage(): JSX.Element {
	return <div className="forumBody">
		<div style={{ display: 'flex', flexDirection: 'row' }}>
			<div style={{ flex: 1 }}>
				<GraphView />
			</div>
		</div>
	</div>;
}

function GraphView(): JSX.Element {
	let params = useParams<{article_id: string}>();
	let article_id = parseInt(params.article_id!);
	let [article_meta, setArticleMeta] = React.useState<ArticleMeta | null>(null);
	let [radius_mode, setRadiusMode] = React.useState(RadiusMode.Energy);
	let [locate, setLocate] = React.useState(false);
	let unlocate = React.useCallback(() => setLocate(false), []);
	React.useEffect(() => {
		if (Number.isNaN(article_id)) {
			toastErr(`${article_id} 不是合法的文章 id`);
			return;
		}
		API_FETCHER.articleQuery.queryArticleMeta(article_id).then(res => {
			if ('Err' in res) {
				toastErr(res.Err);
			} else {
				setArticleMeta(res.Ok);
			}
		});
	}, [article_id]);

	if (article_meta) {
		let radios: [string, RadiusMode][] = [['鍵能', RadiusMode.Energy], ['鍵能絕對值', RadiusMode.AbsEnergy], ['留言數', RadiusMode.CommentNumber]];
		return <div className={style.wrapper}>
			<div className={style.panel}>
				<h3>文章半徑</h3>
				<hr/>
				<div onChange={e => {
					// @ts-ignore
					setRadiusMode(e.target.value);
				}}>
					{radios.map(([name, value]) => {
						return <React.Fragment key={value}>
							<input type="radio" value={value} key={value}
								name="radius-mode" defaultChecked={RadiusMode.Energy == value} />
							{name}
							<br/>
						</React.Fragment>;
					})}
				</div>
				<hr/>
				<button onClick={() => setLocate(true)}>定位當前文章</button>
			</div>
			<GraphViewInner panel={{ radius_mode, locate, unlocate }} meta={article_meta} />
		</div>;
	} else {
		return <></>;
	}
}

let NODE_OPACITY = 0.8;
let NODE_OPACITY_DIM = 0.3;
let GREY = 'rgb(80, 80, 80)';
let GREEN = '#69b3a2';
let YELLOW = '#FFB51E';
let BLUE = '#5B71E3';
let RED = '#d34c4c';
let FONT_SIZE = 12;

function edgeColor(energy: number): string {
	if (energy > 0) {
		return BLUE;
	} else if (energy < 0) {
		return RED;
	} else {
		return GREEN;
	}
}
function markerID(energy: number): string {
	if (energy > 0) {
		return 'arrow-like';
	} else if (energy < 0) {
		return 'arrow-fuck';
	} else {
		return 'arrow';
	}
}

const base_radius = 20;
function computeRadius(meta: ArticleMeta, mode: RadiusMode = RadiusMode.Energy): number {
	let value = 0;
	if (mode == RadiusMode.Energy) {
		value = meta.energy;
	} else if (mode == RadiusMode.AbsEnergy) {
		value = meta.good + meta.bad;
	} else if (mode == RadiusMode.CommentNumber) {
		value = Math.abs(meta.stat.comments);
	} else {
		value = 1;
	}
	return ((value / (1 + Math.abs(value)) + 1) * 0.7 + 0.3) * base_radius;
}

type Node = { id: number, name: string, url: string, meta: ArticleMeta };
type Edge = { target: number, source: number, color: string, marker_id: string, linknum: number };
type EdgeMap = { [from: number]: { [to: number]: boolean } };
type Graph = {
	nodes: Node[],
	edges: Edge[],
	edge_map: EdgeMap
};

type NodeWithXY = { x: number, y: number } & Node;

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


function useRefD3<E extends d3.BaseType, D>(): React.MutableRefObject<
	d3.Selection<E, D, SVGGElement, unknown> |
	null
	> {
	return React.useRef(null);
}

export function GraphViewInner(props: { meta: ArticleMeta, panel: Panel }): JSX.Element {
	let [graph, setGraph] = React.useState<Graph | null>(null);
	let [cur_hovering, setCurHovering] = React.useState<null | NodeWithXY>(null);
	let [offset_x, setOffsetX] = React.useState(0);
	let [offset_y, setOffsetY] = React.useState(0);
	let [init_offset_x, setInitOffsetX] = React.useState(0);
	let [init_offset_y, setInitOffsetY] = React.useState(0);
	let [cur_article_x, setCurArticleX] = React.useState(0);
	let [cur_article_y, setCurArticleY] = React.useState(0);
	let [scale, setScale] = React.useState(1);
	let [opacity, setOpacity] = React.useState(0);
	let graph_div = React.useRef<HTMLDivElement | null>(null);
	let svg_ref = React.useRef<null | d3.Selection<SVGSVGElement, unknown, null ,undefined>>(null);
	let node_ref = useRefD3<SVGCircleElement, Node>();
	let link_ref = useRefD3<SVGPathElement, Edge>();
	let text_ref = useRefD3<SVGTextElement, Node>();
	const navigate = useNavigate();

	function onHover(node: NodeWithXY): void {
		setCurHovering(node);
		setOpacity(0);
		setTimeout(() => {
			setOpacity(100);
		}, 10);
	}

	React.useEffect(() => {
		API_FETCHER.articleQuery.queryGraph(props.meta.id, null).then(res => {
			let g = unwrap(res);
			let counter = new LinkNumCounter();
			let nodes = g.nodes.map(n => {
				return {
					id: n.id,
					url: `${getBoardInfo(n).to_url()}/article/${n.id}`,
					name: `[${n.category}] ${n.title}`,
					meta: n,
				};
			});
			let edges = g.edges.map(e => {
				return {
					source: e.from,
					target: e.to,
					color: edgeColor(e.energy),
					marker_id: markerID(e.energy),
					linknum: counter.count(e.from, e.to)
				};
			});
			setGraph({ nodes, edges, edge_map: buildEdgeMap(edges) });
		}).catch(err => {
			toastErr(err);
		});
	}, [props.meta]);

	function getWidthHeight(): [number, number] {
		let width = graph_div.current!.offsetWidth;
		let full_height = document.getElementsByTagName('body')[0].clientHeight;
		let height = full_height - computeOffsetTop(graph_div.current);
		return [width, height];
	}

	let redraw = React.useCallback((should_blink?: boolean, mode = RadiusMode.Energy) => {
		let [width, height] = getWidthHeight();
		let link = link_ref.current!;
		let node = node_ref.current!;
		let text = text_ref.current!;

		link.attr('d', function (d) {
			// @ts-ignore
			return `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
		});
		link.attr('d', function (d) {
			let curve_inv = 5;
			let homogeneous = 0.2;
			let pl = this.getTotalLength();
			// @ts-ignore
			let m = this.getPointAtLength(pl - computeRadius(d.target.meta, mode) * 1.2);
			// @ts-ignore
			let s = this.getPointAtLength(computeRadius(d.source.meta, mode));
			let order = Math.floor(d.linknum / 2);
			// @ts-ignore
			let dx = m.x - d.source.x, dy = m.y - d.source.y,
				dr = Math.sqrt(dx * dx + dy * dy) * (curve_inv * homogeneous) / (order + homogeneous);
			let direction = d.linknum % 2;
			// @ts-ignore
			return `M${s.x},${s.y} A ${dr} ${dr} 0 0 ${direction} ${m.x} ${m.y}`;
		});
		node.attr('transform', d => {
			if (props.meta.id == d.id) {
				let offset_x = 0, offset_y = 0;
				// @ts-ignore
				let [x, y, diameter] = [d.x, d.y, computeRadius(d.meta, mode) * 2];
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
				setCurArticleX(x);
				setCurArticleY(y);
				setInitOffsetX(offset_x);
				setInitOffsetY(offset_y);
			}
			// @ts-ignore
			return 'translate(' + d.x + ',' + d.y + ')';
		});
		text.attr('transform', function (d) {
			let len = this.getComputedTextLength();
			// @ts-ignore
			return `translate(${d.x - len / 2}, ${d.y + computeRadius(d.meta, mode) + FONT_SIZE})`;
		});
		if (should_blink) {
			blink(props.meta.id, 3);
		}
	}, [link_ref, node_ref, text_ref, props.meta.id]);

	React.useEffect(() => {
		if (graph == null || graph_div.current == null) {
			return;
		}
		let [width, height] = getWidthHeight();
		let svg_super = d3.select(graph_div.current).append('svg')
			.attr('width', width)
			.attr('height', height);
		svg_ref.current = svg_super;

		// @ts-ignore
		svg_super.call(zoom((t) => {
			setOffsetX(t.offset_x);
			setOffsetY(t.offset_y);
			setScale(t.scale);
		}));
		let svg = svg_super.append('g').attr('id', 'canvas');

		let link = svg.append('g')
			.selectAll('path')
			.data(graph.edges)
			.enter()
			.append('path')
			.attr('fill', 'none')
			.attr('stroke', d => d.color)
			.attr('stroke-width', 3)
			.attr('opacity', 0.7)
			.attr('marker-end', d => `url(#${d.marker_id})`);
		link_ref.current = link;

		let node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('g')
			.data(graph.nodes)
			.enter()
			.append('circle')
			.style('fill', d => {
				return d.id == props.meta.id ? YELLOW : GREEN;
			})
			.style('opacity', NODE_OPACITY)
			.style('cursor', 'pointer')
			.attr('id', d => 'a' + d.id)
			.attr('r', d => computeRadius(d.meta))
			.on('mousedown', (_, d) => {
				navigate(d.url);
			})
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
			})
			.on('mouseout', () => setCurHovering(null));
		node_ref.current = node;

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
				navigate(d.url);
			})
			.on('mouseover', (_, d) => {
				// @ts-ignore
				onHover(d);
			})
			.on('mouseout', () => setCurHovering(null));
		text_ref.current = text;

		addMarker(svg, markerID(0), edgeColor(0));
		addMarker(svg, markerID(1), edgeColor(1));
		addMarker(svg, markerID(-1), edgeColor(-1));

		// @ts-ignore
		let simulation = d3.forceSimulation(graph.nodes)
			.force('link', d3.forceLink()
				.links(graph.edges)
				// @ts-ignore
				.id(d => d.id)
			)
			.force('charge', d3.forceManyBody().strength(-2000))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.on('end', () => redraw(true));
		simulation.tick(700);
	}, [graph, props.meta.id, redraw, link_ref, node_ref, text_ref, navigate]);

	React.useEffect(() => {
		if (!props.panel.locate) {
			return;
		}
		if (graph_div.current == null) {
			return;
		}
		let [width, height] = getWidthHeight();
		// init_offset_x * scale + offset_x + cur_article_x = width/2;
		let trans_x = width / 2 - init_offset_x - cur_article_x * scale;
		let trans_y = height / 2 - init_offset_y - cur_article_y * scale;
		// @ts-ignore
		svg_ref.current!.transition().duration(200).call(zoom(t => {
			setOffsetX(t.offset_x);
			setOffsetY(t.offset_y);
			setScale(t.scale);
		}).transform,
		d3.zoomIdentity.translate(trans_x, trans_y).scale(scale)
		);
		blink(props.meta.id, 3);

		props.panel.unlocate();
	}, [props.panel, props.meta.id, cur_article_x, cur_article_y, init_offset_x, init_offset_y, scale]);

	React.useEffect(() => {
		d3.select('#canvas')
		.transition()
		.duration(40)
		.attr('transform', `translate(${offset_x + init_offset_x * scale}, ${offset_y + init_offset_y * scale})scale(${scale})`);
	}, [init_offset_x, init_offset_y, offset_x, offset_y, scale]);

	React.useEffect(() => {
		if (!graph_div.current) {
			return;
		}
		node_ref.current?.transition()
		.duration(200)
		.attr('r', d => computeRadius(d.meta, props.panel.radius_mode));
		redraw(false, props.panel.radius_mode);
	}, [props.panel.radius_mode, node_ref, redraw]);

	React.useEffect(() => {
		if (graph == null) {
			return;
		}
		if (cur_hovering == null) {
			for (let node of graph.nodes) {
				d3.select(`#a${node.id}`).transition()
					.duration(400)
					.attr('r', computeRadius(node.meta, props.panel.radius_mode))
					.style('opacity', NODE_OPACITY);
			}
		} else {
			let highlighted = getHighlighted(graph, cur_hovering);
			for (let node of graph.nodes) {
				if (highlighted[node.id]) {
					d3.select(`#a${node.id}`).transition()
						.duration(400)
						.attr('r', computeRadius(node.meta, props.panel.radius_mode) * 1.2)
						.style('opacity', 1);
				} else {
					d3.select(`#a${node.id}`).transition()
						.duration(400)
						.style('opacity', NODE_OPACITY_DIM);
				}
			}
		}
	}, [cur_hovering, graph, props.panel.radius_mode]);

	if (graph == null) {
		return <></>;
	}
	return <>
		<div ref={graph_div} className={style.svgBlock} style={{ position: 'relative' }}>
			{
				(() => {
					if (cur_hovering == null) {
						return null;
					} else {
						let r = computeRadius(cur_hovering.meta, props.panel.radius_mode);
						return <div key={cur_hovering.id} style={{
							left: (cur_hovering.x + r + init_offset_x) * scale + offset_x,
							top: (cur_hovering.y + r + init_offset_y) * scale + offset_y,
							opacity,
						}} className={style.articleBlock}>
							<ArticleCard article={cur_hovering.meta} bonds={[]}/>
						</div>;
					}
				})()
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

function addMarker(
	svg: d3.Selection<SVGGElement, unknown, null, undefined>,
	id: string,
	color: string,
): void {
	svg.append('defs')
			.append('marker')
			.attr('id', id)
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
			.attr('fill', color);
}

function zoom(
	onTransform: (t: { offset_x: number, offset_y: number, scale: number }) => void
): d3.ZoomBehavior<Element, unknown> {
	let speed = 1;
	return d3.zoom()
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

function blink(id: number, cnt: number): void {
	let cur_node = d3.select(`#a${id}`);
	let dim = NODE_OPACITY / 3;
	function inner(cnt: number): void {
		if (cnt == 0) {
			cur_node.transition()
				.duration(200)
				.style('opacity', NODE_OPACITY);
			return;
		}
		cur_node.transition()
			.duration(200)
			.style('opacity', 1)
			.transition()
			.duration(200)
			.style('opacity', dim)
			.on('end', () => inner(cnt - 1));
	}
	cur_node.transition()
		.duration(200)
		.style('opacity', dim)
		.on('end', () => inner(cnt - 1));
}