import * as React from 'react';
import ReactModal from 'react-modal';
import { Account } from './account';
import { Chat } from './chat';
import { Editor } from './editor';
import { Notification } from './notification';
import { FooterOption, useCurrentFooter } from './footer';

export function Panel(): JSX.Element {
	let footer = useCurrentFooter();
	ReactModal.setAppElement('body');

	if (footer == FooterOption.Home) {
		return <></>;
	}

	return <ReactModal
		isOpen={true}
		overlayClassName="mobileFullContent"
		style={{
			overlay: { zIndex: 10 },
			content: {
				height: '100%',
				width: '100%',
				inset: 0,
				borderStyle: 'none'
			}
		}}
	>
		{
			(() => {
				switch (footer) {
					case FooterOption.Editor:
						return <Editor />;
					case FooterOption.Chat:
						return <Chat />;
					case FooterOption.Notification:
						return <Notification />;
					case FooterOption.Account:
						return <Account />;
				}
			})()
		}
	</ReactModal>;
}

