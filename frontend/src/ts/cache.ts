import { Force, parse } from 'force';
import { unwrap, API_FETCHER } from '../ts/api/api';
import React from 'react';
import { toastErr } from '../tsx/utils';

export const get_force: (id: number) => Promise<Force> = (() => {
	const cache = new Map<number, Force>();
	return async (id: number): Promise<Force> => {
		let force = cache.get(id);
		if (force != undefined) {
			return force;
		} else {
			const board = unwrap(await API_FETCHER.queryBoardById(id));
			force = parse(board.force);
			cache.set(id, force);
			return force;
		}
	};
})();

export function useForce(id: number): Force | null {
	let [force, setForce] = React.useState<Force | null>(null);

	React.useEffect(() => {
		get_force(id).then(data => {
			setForce(data);
		}).catch(err => {
			toastErr(err);
		});
	}, [id]);

	return force;
}