import * as React from 'react';
import { createContainer } from 'unstated-next';

type Location = {name: string, is_board: boolean};
type SetLocation = (b: Location | null) => void;

function useLocationCacheState(): {
	cur_location: Location | null,
	setCurLocation: SetLocation
	} {
	let [cur_location, _setLocation] = React.useState<Location | null>(null);
	let setCurLocation = React.useCallback((location: Location | null) => {
		_setLocation(location);
	}, []);
	return {
		cur_location,
		setCurLocation
	};
}

export const LocationCacheState = createContainer(useLocationCacheState);