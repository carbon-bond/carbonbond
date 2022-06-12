import { unwrap } from '../src/ts/api/api';
import { RootQuery, BoardType, force } from '../src/ts/api/api_trait';
import request from 'request';
import prompts from 'prompts';
import minimist from 'minimist';

let path = require('path');
let fs = require('fs');

const args = minimist(process.argv.slice(2));
const host = args['host'] || 'localhost';
const port = args['port'] || '8080';
const protocal = args['s'] ? 'https' : 'http';
const scripts = args._;
const URL = `${protocal}://${host}:${port}/api`;

type Context = { token: string[], is_logining: boolean };

console.log(`URL = ${URL}`);


let { API_FETCHER, doLogin} = (() => {
	const context: Context  = {
		token: [],
		is_logining: false
	};
	const fetcher = async (query: Object): Promise<string> => {
		const jar = request.jar();
		if (!context.is_logining) {
			let rand = Math.floor(Math.random() * context.token.length);
			const cookie = request.cookie(context.token[rand])!;
			jar.setCookie(cookie, URL);
		}
		return new Promise((resolve, reject) => {
			request(
				{
					url: URL,
					jar,
					method: 'POST',
					gzip: true,
					json: query,
				},
				(err, resp, body) => {
					if (err) {
						reject(err);
					} else {
						if (context.is_logining) {
							let cookies = resp.headers['set-cookie'];
							if (typeof cookies == 'undefined' || cookies.length == 0) {
								reject(`登入失敗！${JSON.stringify(body)}`);
							} else {
								context.token.push(cookies[0]);
							}
						}
						resolve(JSON.stringify(body));
					}
				}
			);
		});
	};
	const API_FETCHER = new RootQuery(fetcher);
	const doLogin = async (): Promise<void> => {
		context.is_logining = true;
		let user_env = process.env.USERS;
		if (user_env) {
			for (let tuple of user_env.split(';')) {
				let [user, password] = tuple.split(',');
				try {
					unwrap(await API_FETCHER.userQuery.login(user, password));
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
					unwrap(await API_FETCHER.userQuery.login(user.username, password.password));
				} catch (e) {
					console.error(e);
				}
			}
		}
		if (context.token.length == 0) {
			throw '至少須登入一個帳號！';
		}
		context.is_logining = false;

	};
	return { doLogin, API_FETCHER };
})();

type ArticleConentElt = number | string | force.Bond;
type ArticleContent = ArticleConentElt[] | ArticleConentElt;

type ArticleConfig = {
	title: string;
	category: string;
	content: { [key: string]: ArticleContent };
	bonds: force.Bond[]
};
type BoardConfig = {
	name: string;
	force: force.Force;
	articles: ArticleConfig[];
};

export async function inject(file: string): Promise<void> {
	console.log(`載入設定檔 ${file}`);
	let boards: BoardConfig[] = JSON.parse(fs.readFileSync(file));
	try {
		await Promise.all(boards.map((b) => injectBoard(b)));
	} catch (err) {
		console.log(err);
	}
}

type IDPosMap = { [pos: number]: number };
async function injectBoard(board: BoardConfig): Promise<void> {
	let party_id = unwrap(
		await API_FETCHER.partyQuery.createParty(
			`小工具專用黨-${Math.floor(Math.random() * 999999)}`,
			null
		)
	);

	let categories = board.force.categories;
	let id_pos_map: IDPosMap = {};
	let board_id: number;

	try {
		let b = unwrap(await API_FETCHER.boardQuery.queryBoard(board.name, BoardType.General));
		board_id = b.id;
	} catch (err) {
		try {
			console.log(`找不到看板 ${board.name}，嘗試創起來`);
			board_id = unwrap(
				await API_FETCHER.boardQuery.createBoard({
					ruling_party_id: party_id,
					board_name: board.name,
					board_type: BoardType.General,
					title: '測試標題',
					detail: '測試',
					force: board.force,
				})
			);
			console.log(`創板成功 ${board.name} = ${board_id}`);
		} catch (err) {
			console.log(`創板失敗 ${err}`);
			return;
		}
	}

	for (let i = 0; i < board.articles.length; i++) {
		let article = board.articles[i];
		let category = categories.find(c => c.name = article.category);
		if (category == undefined) {
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
	category: force.Category,
	id_pos_map: IDPosMap
): Promise<number> {
	for (let field_name of Object.keys(article.content)) {
		let field = category.fields.find((f) => f.name == field_name);
		if (!field) {
			throw `未知的欄位名 ${field_name}`;
		}
	}
	let id = unwrap(
		await API_FETCHER.articleQuery.createArticle(
			{
				board_id: board_id,
				category_name: category.name,
				title: article.title,
				content: JSON.stringify(article.content),
				bonds: article.bonds.map(bond => { return { ...bond, to: id_pos_map[bond.to] }; }),
				draft_id: null,
				anonymous: false
			}
		)
	);
	return id;
}

async function main(): Promise<void> {
	try {
		await doLogin();
		if (scripts.length > 0) {
			for (let file of scripts) {
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
