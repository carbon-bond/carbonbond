import * as React from 'react';
import { isImageLink, isLink } from '../../ts/regex_util';

export function ShowWord(props: { word: string }): JSX.Element {
	if (isImageLink(props.word)) {
		return <a target="_blank" href={props.word}>
			{props.word}
			<img src={props.word.trim()} width="100%" alt="圖片" />
		</a>;
	} else if (isLink(props.word)) {
		return <a target="_blank" href={props.word}>{props.word}</a>;
	} else {
		return <React.Fragment>{props.word}</React.Fragment>;
	}
}

export function CleanShowLine(props: {line: string}): JSX.Element {
	let elements: JSX.Element[] = [];
	props.line.split(' ').forEach((word, index)=> {
		elements.push(<ShowWord key={index} word={word}></ShowWord>);
	});
	return <>{elements}</>;
}

export function ShowLine(props: { line: string }): JSX.Element {
	const line = props.line;
	let key = 0;
	if (/^\s*$/.test(line)) {
		// 若整行都是空的，換行
		return <br key={key++} />;
	} else {
		return <p key={key++}>
			<CleanShowLine line={line} />
		</p>;
	}
}

export function ShowPureText(props: { text: string; }): JSX.Element {
	let key = 0;
	return <>{props.text.split('\n').map(line => {
		return <ShowLine key={key++} line={line} />;
	})}
	</>;
}
