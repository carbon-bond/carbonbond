import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import queryString from 'query-string';
import { toast } from 'react-toastify';

function _getQueryOr(name: string, query: queryString.ParsedQuery, default_val: string): string {
	try {
		return getQuery(name, query);
	} catch (_) {
		return default_val;
	}
}

function getQueryOpt(name: string, query: queryString.ParsedQuery): string | null {
	try {
		return getQuery(name, query);
	} catch (_) {
		return null;
	}
}
function getQuery(name: string, query: queryString.ParsedQuery): string {
	let s = query[name];
	if (typeof s == 'string') {
		return s;
	}
	throw `錯誤的詢問字串 ${name} - ${s}`;
}

export function SearchPage(props: RouteComponentProps): JSX.Element {
	try {
		let opt = queryString.parse(props.location.search);
		let content = getQuery('content', opt);
		let board = getQueryOpt('board', opt);
		return <div>開搜，板 {board},標題 {content}</div>;
	} catch (err) {
		toast.error(err);
		return <div>錯誤 {err}</div>;
	}
}
