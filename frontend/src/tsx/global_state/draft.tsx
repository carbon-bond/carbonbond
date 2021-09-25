import * as React from 'react';
const { useState } = React;
import { createContainer } from 'unstated-next';
import { Draft } from '../../ts/api/api_trait';


function useDraftState(): {
	setDraftData: (data: Draft[]) => void,
	draft_data: Draft[],
	} {
	let [draft_data, setDraftData] = useState<Draft[]>([]);

	return {
		draft_data,
		setDraftData
	};
}

export const DraftState = createContainer(useDraftState);