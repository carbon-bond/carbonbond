import { parse, Category } from 'force';
import { unwrap } from '../src/ts/api/api';
import { RootQueryFetcher } from '../src/ts/api/api_trait';
import request from 'request';

let path = require('path');
let fs = require('fs');


export class InjectFetcher extends RootQueryFetcher {
	fetchResult(query: Object): Promise<string> {
		let url = 'http://localhost:8080/api';
		const jar = request.jar();
		const cookie = request.cookie('id=1')!;
		jar.setCookie(cookie, url);
		return new Promise((resolve, reject) => {
			request(
				{
					url,
					jar,
					method: 'POST',
					json: query,
				},
				(err, _, body) => {
					if (err) {
						reject(err);
					} else {
						resolve(JSON.stringify(body));
					}
				}
			);
		});
	}
}

let API_FETCHER = new InjectFetcher();


type ArticleConent = number | string | number[] | string[];

type ArticleConfig = {
  title: string;
  category: string;
  content: { [key: string]: ArticleConent };
};
type BoardConfig = {
  name: string;
  force: string[];
  articles: ArticleConfig[];
};

export async function inject(file: string): Promise<void> {
	console.log(`載入設定檔 ${file}`);
	let boards: BoardConfig[] = JSON.parse(fs.readFileSync(file));
	let party_id = unwrap(await API_FETCHER.createParty( `小工具專用黨-${Math.floor(Math.random() * 999999)}`, null));
	await Promise.all(boards.map(b => injectBoard(b, party_id)));
}

type IDPosMap = { [pos: number]: number };
async function injectBoard(board: BoardConfig, party_id: number): Promise<void> {
	let force_str = board.force.join('\n');
	let force = parse(force_str);
	let categories = force.categories;
	let id_pos_map: IDPosMap = {};
	let board_id: number;
	try {
		board_id = unwrap(
			await API_FETCHER.createBoard({
				ruling_party_id: party_id,
				board_name: board.name,
				title: '測試標題',
				detail: '測試',
				force: force_str,
			})
		);
	} catch (_) {
		let b = unwrap(await API_FETCHER.queryBoard(board.name));
		board_id = b.id;
	}
	console.log(`創板成功 ${board.name} = ${board_id}`);
	for (let i = 0; i < board.articles.length; i++) {
		let article = board.articles[i];
		let category = categories.get(article.category);
		if (!category) {
			throw `未知的分類 ${article.category}`;
		}
		let id = await injectArticle(board_id, article, category, id_pos_map);
		console.log(`發文成功 ${article.title} = ${id}`);
		id_pos_map[i] = id;
	}
}
async function injectArticle(
	board_id: number,
	article: ArticleConfig,
	category: Category,
	id_pos_map: IDPosMap
): Promise<number> {
	for (let field_name of Object.keys(article.content)) {
		let field = category.fields.find((f) => f.name == field_name);
		let content = article.content[field_name];
		console.log(`處理欄位 ${field_name}： ${JSON.stringify(field)}`);
		if (!field) {
			throw `未知的欄位名 ${field_name}`;
		}
		if (field.datatype.t.kind == 'bond') {
			// TODO: tag_bond
			if (field.datatype.kind == 'single') {
				if (Array.isArray(content)) {
					throw `${field_name} 應該是單元`;
				} else if (typeof content == 'number') {
					article.content[field_name] = mapID(content, id_pos_map);
				} else {
					throw `${field_name} 應該是鍵結`;
				}
			} else if (field.datatype.kind == 'array') {
				if (!Array.isArray(content)) {
					throw `${field_name} 應該是陣列`;
				} else {
					for (let i = 0; i < content.length; i++) {
						let c = content[i];
						if (typeof c == 'number') {
							content[i] = mapID(c, id_pos_map);
						} else {
							throw `${field_name}.${i} 應該是鍵結`;
						}
					}
				}
			}
		}
	}
	let id = unwrap(
		await API_FETCHER.createArticle(
			board_id,
			category.name,
			article.title,
			JSON.stringify(article.content),
		)
	);
	return id;
}

function mapID(pos: number, id_pos_map: IDPosMap): number {
	if (pos in id_pos_map) {
		console.log(`對應成功：${pos} => ${id_pos_map[pos]}`);
		return id_pos_map[pos];
	}
	throw `未知的文章序：${pos}`;
}

if (process.argv.length > 2) {
	for (let file of process.argv.slice(2)) {
		inject(file);
	}
} else {
	let p = path.resolve(__dirname, 'inject_config.default.json');
	inject(p);
}
