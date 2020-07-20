import { useScrollState } from '../utils';
import { createContainer } from 'unstated-next';

function useMainScrollState(): {
	setEmitter: (emitter: HTMLElement | null) => void,
	useScrollToBottom: (handler: () => void) => void
	} {
	return useScrollState();
}

export const MainScrollState = createContainer(useMainScrollState);