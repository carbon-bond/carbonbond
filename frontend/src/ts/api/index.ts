import { GraphQLClient } from 'graphql-request';

import * as GQL from './gql';

// eslint-disable-next-line
async function gqlFetcher(query: string, variables?: Object): Promise<any> {
	let client = new GraphQLClient('/api');
	return await client.request(query, variables);
}

function extractErrMsg(err: { response: { errors: { message: string }[] } } | Error): string {
	try {
		if ('response' in err) {
			return err.response.errors[0].message;
		} else {
			return err.message;
		}
	} catch (_e) {
		return JSON.stringify(err);
	}
}

const ajaxOperation = new GQL.AjaxOperation(gqlFetcher);

export {
	extractErrMsg,
	GQL,
	ajaxOperation
};