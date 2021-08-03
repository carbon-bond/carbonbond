/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { UserMini } from '../../../src/ts/api/api_trait';
import { BrowserRouter } from 'react-router-dom';

import { UserCard } from '../../../src/tsx/profile/user_card';

// eslint-disable-next-line
let container: any = null;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	unmountComponentAtNode(container);
	container.remove();
	container = null;
});

test('渲染 UserCard 元件', async () => {
	const fakeUser: UserMini = {
		id: 1,
		user_name: 'Joni Baez',
		energy: 33,
		sentence: 'YOLO'
	};

	act(() => {
		render(<BrowserRouter>
			<UserCard user={fakeUser} />
		</BrowserRouter>, container);
	});

	expect(container.querySelector('.userName').textContent).toBe(fakeUser.user_name);
	expect(container.querySelector('.userSentence').textContent).toBe(fakeUser.sentence);
	expect(container.querySelector('.num').textContent).toBe(String(fakeUser.energy));
	expect(container.querySelector('.overlay').getAttribute('href')).toBe('/app/user/' + fakeUser.user_name);
});
