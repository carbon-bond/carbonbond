import { GraphQLClient } from 'graphql-request';

export type LoginResponse = {
	login: null | { message: string }
};

export type Me = { me: { id: string | null } };

async function me_request(): Promise<Me> {
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
	const query = `
		query {
			me {
				id
			}
		}
	`;
	return await graphQLClient.request(query);
}

async function login_request(id: string, password: string): Promise<LoginResponse> {
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
	const query = `
			mutation {
				login(id: "${id}", password: "${password}") {
					message
				}
			}
		`;
	return await graphQLClient.request(query);
}

export type LogoutResponse = {
	logout: null | { message: string }
};

async function logout_request(): Promise<LogoutResponse> {
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
	const query = `
			mutation {
				logout {
					message
				}
			}
		`;
	return await graphQLClient.request(query);
}

export {
	me_request,
	login_request,
	logout_request
};