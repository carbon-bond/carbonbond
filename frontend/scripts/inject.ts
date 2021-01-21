import { parse, Category } from 'force';
import { unwrap } from '../src/ts/api/api';
import { Bond, RootQueryFetcher, BoardType } from '../src/ts/api/api_trait';
import request from 'request';
import prompts from 'prompts';

let path = require('path');
let fs = require('fs');

const URL = 'http://localhost:8080/api';
export class InjectFetcher extends RootQueryFetcher {
	token: string[] = [];
	is_logining = false;
	constructor() {
		super();
	};
	async doLogin(): Promise<void> {
		this.is_logining = true;
		let user_env = process.env.USERS;
		if (user_env) {
			for (let tuple of user_env.split(';')) {
				let [user, password] = tuple.split(',');
				try {
					unwrap(await this.login(user, password));
				} catch (e) {
					console.error(e);
				}
			}
		} else {
			console.log('\n### 請登入至少一組帳號 ###\n');
			console.log('小技巧：你可以用環境變數來設定使用者列表。例如 USERS="金剛,aaa;石墨,bbb;巴克,ccc" yarn inject\n');
			while (true) {
				let user = await prompts({
					type: 'text',
					name: 'username',
					message: '帳號（輸入空字串即結束登入）',
				});
				if (!user.username) {
					break;
				}
				let password = await prompts({
					type: 'password',
					name: 'password',
					message: '密碼',
				});
				try {
					unwrap(await this.login(user.username, password.password));
				} catch (e) {
					console.error(e);
				}
			}
		}
		if (this.token.length == 0) {
			throw '至少須登入一個帳號！';
		}
		this.is_logining = false;
	}
	fetchResult(query: Object): Promise<string> {
		const jar = request.jar();
		if (!this.is_logining) {
			let rand = Math.floor(Math.random() * this.token.length);
			const cookie = request.cookie(this.token[rand])!;
			jar.setCookie(cookie, URL);
		}
		return new Promise((resolve, reject) => {
			request(
				{
					url: URL,
					jar,
					method: 'POST',
					json: query,
				},
				(err, resp, body) => {
					if (err) {
						reject(err);
					} else {
						if (this.is_logining) {
							let cookies = resp.headers['set-cookie'];
							if (typeof cookies == 'undefined' || cookies.length == 0) {
								reject(`登入失敗！${JSON.stringify(body)}`);
							} else {
								this.token.push(cookies[0]);
							}
						}
						resolve(JSON.stringify(body));
					}
				}
			);
		});
	}
}

let API_FETCHER = new InjectFetcher();

type ArticleConentElt = number | string | Bond;
type ArticleContent = ArticleConentElt[] | ArticleConentElt;

type ArticleConfig = {
	title: string;
	category: string;
	content: { [key: string]: ArticleContent };
};
type BoardConfig = {
	name: string;
	force: string[];
	articles: ArticleConfig[];
};

export async function inject(file: string): Promise<void> {
	console.log(`載入設定檔 ${file}`);
	await API_FETCHER.doLogin();
	let boards: BoardConfig[] = JSON.parse(fs.readFileSync(file));
	let party_id = unwrap(
		await API_FETCHER.createParty(
			`小工具專用黨-${Math.floor(Math.random() * 999999)}`,
			null
		)
	);
	try {
		await Promise.all(boards.map((b) => injectBoard(b, party_id)));
	} catch (err) {
		console.log(err);
	}
}

type IDPosMap = { [pos: number]: number };
async function injectBoard(
	board: BoardConfig,
	party_id: number
): Promise<void> {
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
				board_type: BoardType.General,
				title: '測試標題',
				detail: '測試',
				force: force_str,
			})
		);
	} catch (_) {
		let b = unwrap(await API_FETCHER.queryBoard(board.name, BoardType.General));
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
				}
				article.content[field_name] = mapIDAsBond(content, id_pos_map);
			} else if (field.datatype.kind == 'array') {
				if (!Array.isArray(content)) {
					throw `${field_name} 應該是陣列`;
				} else {
					for (let i = 0; i < content.length; i++) {
						let c = content[i];
						content[i] = mapIDAsBond(c, id_pos_map);
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
			JSON.stringify(article.content)
		)
	);
	return id;
}

function mapIDAsBond(arg: ArticleConentElt, id_pos_map: IDPosMap): Bond {
	if (typeof arg == 'number') {
		return { target_article: mapID(arg), energy: 0, tag: null };
	} else if (typeof arg == 'object') {
		arg.target_article = mapID(arg.target_article);
		return arg;
	} else {
		throw `應該是鍵結，得到 ${arg}`;
	}

	function mapID(pos: number): number {
		if (pos in id_pos_map) {
			console.log(`對應成功：${pos} => ${id_pos_map[pos]}`);
			return id_pos_map[pos];
		}
		throw `未知的文章序：${arg}`;
	}
}

async function main(): Promise<void> {
	try {
		if (process.argv.length > 2) {
			for (let file of process.argv.slice(2)) {
				await inject(file);
			}
		} else {
			let p = path.resolve(__dirname, 'inject_config.default.json');
			await inject(p);
		}
	} catch (err) {
		console.log(`錯誤 ${err}`);
	}
}

main();