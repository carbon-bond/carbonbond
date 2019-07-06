import { GraphQLClient } from 'graphql-request';

export type LoginResponse = {
	login: true
};

export type Me = { me: { id: string | null } };

function me_request(): Promise<Me> {
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
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
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
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
	const endpoint = 'http://localhost:8080/api';
	const graphQLClient = new GraphQLClient(endpoint);
	const query = `
			mutation {
				logout
			}
		`;
	return graphQLClient.request(query);
}

export {
	me_request,
	login_request,
	logout_request,
};