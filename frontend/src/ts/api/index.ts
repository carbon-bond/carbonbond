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
	} catch {
		return JSON.stringify(err);
	}
}

function matchErrAndShow(err: GQLError | Error): void {
	if ('response' in err) {
		// Graphql 回傳的錯誤
		const msg = extractErrKey(err);
		toast.error(msg);
	} else {
		// 前端的錯誤操作，被直接拋出來
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