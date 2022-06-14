import { api_trait } from 'carbonbond-api/index';
import { getEnvVars } from './env';

async function fetchResult(query: Object): Promise<string> {
	let info = JSON.stringify(query);
	if (info.length > 300) {
		info = '太長，省略';
	}
	const url = `${getEnvVars().server}/api?query=${info}`;

	console.log(`url = ${url}`);

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(query),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	});

	const text = await response.text();

	return (text);
}

export const API_FETCHER = new api_trait.RootQuery(fetchResult);