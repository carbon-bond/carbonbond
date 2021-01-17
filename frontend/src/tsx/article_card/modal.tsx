import * as React from 'react';
import ReactModal from 'react-modal';
import { ArticleMeta } from '../../ts/api/api_trait';

function Modal<T>(props: { close: () => void, children: T }): JSX.Element {
	ReactModal.setAppElement('body');
	return <ReactModal
		isOpen={true}
		onRequestClose={() => props.close()}
		// className={'ModalWindow--Content'}
		style={{
			overlay: { zIndex: 200 },
			content: {
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				right: 'none',
				bottom: 'none',
				padding: '2px'
			}
		}} >
		{props.children}
	</ReactModal>;
}
export function ReplyModal(props: { article: ArticleMeta, close: () => void }): JSX.Element {
	return <Modal close={props.close}>
		<div>回文!</div>
	</Modal>;
}
export function SatelliteModal(props: { article: ArticleMeta, close: () => void }): JSX.Element {
	return <Modal close={props.close}>
		<div>衛星!</div>
	</Modal>;
}