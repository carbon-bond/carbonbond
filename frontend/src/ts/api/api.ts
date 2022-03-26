import * as api_trait from './api_trait';
import { toastErr } from '../../tsx/utils';

async function fetchResult(query: Object): Promise<string> {
	let info = JSON.stringify(query);
	if (info.length > 300) {
		info = '太長，省略';
	}
	const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api?query=${info}`;

	const response = await fetch(url, {
		body: JSON.stringify(query),
		method: 'POST'
	});

	const text = await response.text();

	return (text);
}

export const API_FETCHER = new api_trait.RootQuery(fetchResult);

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

export function map_or_else<T, U>(option: api_trait.Option<T>, fn: (og: T) => U, fn_default: () => U): U {
	if (option === null) {
		return fn_default();
	} else {
		return fn(option);
	}
}

// 打印錯誤並回傳預設資料
export function unwrap_or<T, E>(result: api_trait.Result<T, E>, alt: T): T {
	if ('Ok' in result) {
		return result.Ok;
	} else {
		toastErr(result.Err);
		return alt;
	}
}
