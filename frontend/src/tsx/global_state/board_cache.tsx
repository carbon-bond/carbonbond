import * as React from 'react';
import { createContainer } from 'unstated-next';

type Location = {name: string, is_article_page: boolean};
type SetLocation = (b: Location | null) => void;

function useLocationCacheState(): {
	current_location: Location | null,
	setCurrentLocation: SetLocation
	} {
	let [current_location, _setLocation] = React.useState<Location | null>(null);
	let setCurrentLocation = React.useCallback((location: Location | null) => {
		_setLocation(location);
	}, []);
	return {
		current_location,
		setCurrentLocation
	};
}

export const LocationCacheState = createContainer(useLocationCacheState);