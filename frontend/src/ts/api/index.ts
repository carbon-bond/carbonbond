import { GraphQLClient } from 'graphql-request';
import { toast } from 'react-toastify';

import * as GQL from './gql';

type GQLError = { response: { errors: { message: string }[] } };

// eslint-disable-next-line
async function gqlFetcher(query: string, variables?: Object): Promise<any> {
	let client = new GraphQLClient('/api');
	return await client.request(query, variables);
}

function extractErrKey(err: GQLError): string {
	try {
		return err.response.errors[0].message;
	} catch (_e) {
		return JSON.stringify(err);
	}
}

function matchErrAndShow(err: GQLError | Error, ...map: [string, string][]): void {
	if ('response' in err) {
		let cur_key = extractErrKey(err);
		let match = cur_key.match(/^BAD_OPERATION\((.+)\)$/);
		if (match) {
			// 直接把訊息打印出來
			toast.error(`錯誤操作：${match[1]}`);
			return;
		}
		map.push(['NEED_LOGIN', '尚未登入']);
		for (let [key, msg] of map) {
			if (cur_key.startsWith(key)) {
				toast.error(msg);
				return;
			}
		}
		toast.error('內部錯誤');
	} else {
		toast.error(err.message);
	}
}

const ajaxOperation = new GQL.AjaxOperation(gqlFetcher);

export {
	extractErrKey,
	matchErrAndShow,
	GQL,
	ajaxOperation
};