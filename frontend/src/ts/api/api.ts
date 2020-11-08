import * as api_trait from './api_trait';
import { toast } from 'react-toastify';

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
		throw JSON.stringify(result.Err);
	}
}

export function map<T, U>(option: api_trait.Option<T>, fn: (og: T) => U): api_trait.Option<U> {
	if (option === null) {
		return null;
	} else {
		return fn(option);
	}
}

// 打印錯誤並回傳預設資料
export function unwrap_or<T, E>(result: api_trait.Result<T, E>, alt: T): T {
	if ('Ok' in result) {
		return result.Ok;
	} else {
		toast.error(JSON.stringify(result.Err));
		return alt;
	}
}

export const API_FETCHER = new ApiFetcher();