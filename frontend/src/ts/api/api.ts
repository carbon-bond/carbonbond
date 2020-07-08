import * as api_trait from './api_trait';

export class ApiFetcher extends api_trait.RootQueryFetcher {
	async fetchResult(query: Object): Promise<string> {

		const url = `http://${window.location.hostname}:${window.location.port}/api`;

		const response = await fetch(url, {
			body: JSON.stringify(query),
			method: 'POST'
		});

		const text = await response.text();

		return (text);
	}
}

export function unwrap<T, E>(result: api_trait.Result<T, E>): T {
	if ('Ok' in result) {
		return result.Ok;
	} else {
		throw result.Err;
	}
}

export const API_FETCHER = new ApiFetcher();