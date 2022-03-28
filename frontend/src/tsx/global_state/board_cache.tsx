import * as React from 'react';
import { createContainer } from 'unstated-next';

type Location = {name: string, is_board: boolean};
type SetLocation = (b: Location | null) => void;

function useLocationCacheState(): {
	current_location: Location | null,
	setCurLocation: SetLocation
	} {
	let [current_location, _setLocation] = React.useState<Location | null>(null);
	let setCurLocation = React.useCallback((location: Location | null) => {
		_setLocation(location);
	}, []);
	return {
		current_location,
		setCurLocation
	};
}

export const LocationCacheState = createContainer(useLocationCacheState);