import { unwrap } from 'carbonbond-api/api_utils';
import { RootQuery, BoardType, force } from 'carbonbond-api/api_trait';
import prompts from 'prompts';
import minimist from 'minimist';

import * as path from 'path';
import * as fs from 'fs';

const args = minimist(process.argv.slice(2));
const host = args['host'] || 'localhost';
const port = args['port'] || '8080';
const protocal = args['s'] ? 'https' : 'http';
const scripts = args._;
const URL = `${protocal}://${host}:${port}/api`;

console.log(`URL = ${URL}`);

async function doLogin(): Promise<string[]> {
	let tokens: string[] = [];

	const fetcher = async (query: Object): Promise<string> => {
		return fetch(URL, {
			body: JSON.stringify(query),
			method: 'POST',
		}).then(response => {
			const cookie = response.headers.get('set-cookie');
			if (cookie == null || cookie.length == 0) {
				throw new Error(`登入失敗！${JSON.stringify(response.body)}`);
			} else {
				tokens.push(cookie);
			}
			return response.json();
		}).then(json => {
			return JSON.stringify(json);
		});
	};
	const API_FETCHER = new RootQuery(fetcher);

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
	if (tokens.length == 0) {
		throw '至少須登入一個帳號！';
	}
	return tokens;
}

type IDMap = { [index: number]: number };

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

class RandomUser {
	tokens: string[];
	API_FETCHER: RootQuery;
	is_locked: boolean;
	locked_token: string | null;
	constructor(tokens: string[]) {
		this.tokens = tokens;
		this.is_locked = false;
		this.locked_token = null;
		const fetcher = async (query: Object): Promise<string> => {
			return fetch(URL, {
				body: JSON.stringify(query),
				method: 'POST',
				headers: {
					cookie: this.get_token(),
					credentials: 'include'
				}
			}).then(response => response.json())
			.then(json => {
				return JSON.stringify(json);
			});
		};
		this.API_FETCHER = new RootQuery(fetcher);
	}
	lockUser(): void {
		this.is_locked = true;
		this.locked_token = null;
	};
	unlockUser(): void {
		this.is_locked = false;
		this.locked_token = null;
	};
	random_token(): string {
		let rand = Math.floor(Math.random() * this.tokens.length);
		return this.tokens[rand];
	};
	get_token(): string {
		if (this.is_locked) {
			this.locked_token = this.locked_token ?? this.random_token();
			return this.locked_token;
		}
		return this.random_token();
	}
	async injectBoard(board: BoardConfig): Promise<void> {
		this.lockUser();
		let party_id = -1;
		try {

			party_id = unwrap(
				await this.API_FETCHER.partyQuery.createParty(
					`小工具專用黨-${Math.floor(Math.random() * 999999)}`,
					null
				)
			);
		} catch (err) {
			console.error(err);
		}

		let categories = board.force.categories;
		let index_to_database_id: IDMap = {};
		let board_id: number;

		try {
			let b = unwrap(await this.API_FETCHER.boardQuery.queryBoard(board.name, BoardType.General));
			board_id = b.id;
		} catch (err) {
			try {
				console.log(`找不到看板 ${board.name}，嘗試創起來`);
				board_id = unwrap(
					await this.API_FETCHER.boardQuery.createBoard({
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
		} finally {
			this.unlockUser();
		}

		for (let i = 0; i < board.articles.length; i++) {
			let article = board.articles[i];
			let category = categories.find(c => c.name = article.category);
			if (category == undefined) {
				throw `未知的分類 ${article.category}`;
			}
			let id = await this.injectArticle(board_id, article, category, index_to_database_id);
			console.log(`發文成功 ${article.title} = ${id}`);
			index_to_database_id[i] = id;
		}
	}
	async injectArticle(
		board_id: number,
		article: ArticleConfig,
		category: force.Category,
		index_to_database_id: IDMap
	): Promise<number> {
		for (let field_name of Object.keys(article.content)) {
			let field = category.fields.find((f) => f.name == field_name);
			if (!field) {
				throw `未知的欄位名 ${field_name}`;
			}
		}
		let id = unwrap(
			await this.API_FETCHER.articleQuery.createArticle(
				{
					board_id: board_id,
					category_name: category.name,
					title: article.title,
					content: JSON.stringify(article.content),
					bonds: article.bonds.map(bond => { return { ...bond, to: index_to_database_id[bond.to] }; }),
					draft_id: null,
					anonymous: false
				}
			)
		);
		return id;
	}
}

export async function inject(file: string, tokens: string[]): Promise<void> {
	console.log(`載入設定檔 ${file}`);
	let boards: BoardConfig[] = JSON.parse(fs.readFileSync(file).toString());
	try {
		await Promise.all([boards.map((board) => {
			const random_user = new RandomUser(tokens);
			return random_user.injectBoard(board);
		})]);
	} catch (err) {
		console.log(err);
	}
}

async function main(): Promise<void> {
	try {
		const tokens = await doLogin();
		console.log(tokens);
		if (scripts.length > 0) {
			for (let file of scripts) {
				await inject(file, tokens);
			}
		} else {
			let p = path.resolve(__dirname, 'data/default.json');
			await inject(p, tokens);
		}
	} catch (err) {
		console.log(`錯誤 ${err}`);
	}
}

main();
