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

function login_request(id: string, password: string): Promise<LoginResponse> {
	const graphQLClient = getGraphQLClient();
	const query = `
			mutation {
				login(id: "${id}", password: "${password}")
			}
		`;
	return graphQLClient.request(query);
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

export function extractErrMsg(err: { response: { errors: { message: string }[] } }): string {
	return err.response.errors[0].message;
}

export {
	me_request,
	login_request,
	logout_request,
	getGraphQLClient
};