import { getGraphQLClient } from './api';

export type Category = {
	name: string,
	transfusable: boolean,
	is_question: boolean,
	show_in_list: boolean,
	rootable: boolean,
	threshold_to_post: {
		bond_energy: number,
		position: number
	},
	attached_to: string[],
	structure: { col_name: string, col_type: string, restriction: string }[],
};

export async function fetchCategories(
	board_name: string,
	atteched_to: string[]=[]
): Promise<Category[]> {
	// TODO: 快取?
	const graphQLClient = getGraphQLClient();
	const query = `
			query Categories($board_name: String!) {
				board(name: $board_name) {
					categories {
						body
					}
				}
			}
		`;
	let bodies: { board: { categories: { body: string }[] } } = await graphQLClient.request(query, {
		board_name
	});
	let ret: Category[] = bodies.board.categories.map(c => JSON.parse(c.body));
	return ret.filter(cat => {
		if (atteched_to.length == 0 && !cat.rootable) {
			return false;
		} else if (cat.name == '留言') {
			// NOTE: 留言使用不同的界面來發佈
			return false;
		} else {
			// 必需可以指向 atteched_to 的每一種
			for (let name of atteched_to) {
				if (cat.attached_to.indexOf(name) == -1) {
					return false;
				}
			}
			return true;
		}
	});
}