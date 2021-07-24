import * as React from 'react';
import ReactModal from 'react-modal';

export function NotificationModal(): JSX.Element {
	ReactModal.setAppElement('body');
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
        TODO: 通知
	</ReactModal>;
}