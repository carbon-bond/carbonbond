import { Force, parse } from 'force';
import { unwrap, API_FETCHER } from '../ts/api/api';
import React from 'react';
import { toast } from 'react-toastify';

export const get_force: (board_name: string) => Promise<Force> = (() => {
	const cache = new Map<string, Force>();
	return async (board_name: string): Promise<Force> => {
		let force = cache.get(board_name);
		if (force != undefined) {
			return force;
		} else {
			const board = unwrap(await API_FETCHER.queryBoard(board_name));
			force = parse(board.force);
			cache.set(board_name, force);
			return force;
		}
	};
})();

export function useForce(board_name: string): Force | null {
	let [force, setForce] = React.useState<Force | null>(null);

	React.useEffect(() => {
		get_force(board_name).then(data => {
			setForce(data);
		}).catch(err => {
			toast.error(err);
		});
	}, [board_name]);

	return force;
}