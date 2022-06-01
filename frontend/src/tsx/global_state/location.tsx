import * as React from 'react';
import { createContainer } from 'unstated-next';

interface Location {
	to_document_title: () => string,
	show_in_header: () => string,
}

export class SimpleLocation implements Location {
	name: string;
	constructor(name: string) {
		this.name = name;
	}
	to_document_title(): string {
		return this.name;
	};
	show_in_header(): string {
		return this.name;
	};
}

export class ArticleLocation implements Location {
	article_title: string;
	board_name: string;
	constructor(board_name: string, article_title: string) {
		this.board_name = board_name;
		this.article_title = article_title;
	}
	to_document_title(): string {
		return this.article_title;
	};
	show_in_header(): string {
		return this.board_name;
	};
}

export class BoardLocation implements Location {
	board_name: string;
	constructor(board_name: string) {
		this.board_name = board_name;
	}
	to_document_title(): string {
		return `看板 | ${this.board_name}`;
	};
	show_in_header(): string {
		return this.board_name;
	};
}

export class PartyLocation implements Location {
	party_name: string;
	constructor(party_name: string) {
		this.party_name = party_name;
	}
	to_document_title(): string {
		return `政黨 | ${this.party_name}`;
	};
	show_in_header(): string {
		return this.party_name;
	};
}

export class UserLocation implements Location {
	user_name: string;
	constructor(user_name: string) {
		this.user_name = user_name;
	}
	to_document_title(): string {
		return `卷宗 | ${this.user_name}`;
	};
	show_in_header(): string {
		return this.user_name;
	};
}

function useLocationState(): {
	current_location: Location | null,
	setCurrentLocation: (location: Location | null) => void;
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

export const LocationState = createContainer(useLocationState);