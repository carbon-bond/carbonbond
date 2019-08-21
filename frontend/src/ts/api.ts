import { GraphQLClient } from 'graphql-request';

export type LoginResponse = {
	login: true
};

export type Me = { me: { id: string | null } };

function getGraphQLClient(endpoint='/api'): GraphQLClient {
	return new GraphQLClient(endpoint);
}

function me_request(): Promise<Me> {
	const graphQLClient = getGraphQLClient();
	const query = `
		query {
			me {
				id
			}
		}
	`;
	return graphQLClient.request(query);
}

function login_request(name: string, password: string): Promise<LoginResponse> {
	const graphQLClient = getGraphQLClient();
	const query = `
			mutation Login($name: String!, $password: String!) {
				login(name: $name, password: $password)
			}
		`;
	return graphQLClient.request(query, {
		name, password
	});
}

export type LogoutResponse = {
	logout: null | { message: string }
};

function logout_request(): Promise<LogoutResponse> {
	const graphQLClient = getGraphQLClient();
	const query = `
			mutation {
				logout
			}
		`;
	return graphQLClient.request(query);
}

export function extractErrMsg(err: { response: { errors: { message: string }[] } } | Error): string {
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

export {
	me_request,
	login_request,
	logout_request,
	getGraphQLClient
};
