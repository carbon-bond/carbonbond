import * as React from 'react';
import { isImageLink, isLink } from '../../ts/regex_util';

export function ShowLine(props: {line: string}): JSX.Element {
	let key = 0;
	let elements: JSX.Element[] = [];
	props.line.split(' ').forEach(word => {
		if (isLink(word)) {
			elements.push(<a key={key++} target="_blank" href={word}>{word}</a>);
		} else {
			elements.push(<React.Fragment key={key++}>{word}</React.Fragment>);
		}
		elements.push(<React.Fragment key={key++}> </React.Fragment>);
	});
	return <>{elements}</>;
}

export function ShowText(props: { text: string; }): JSX.Element {
	let key = 0;
	return <>{props.text.split('\n').map(line => {
		if (/^\s*$/.test(line)) {
			// 若整行都是空的，換行
			return <br key={key++} />;
		} else if (isImageLink(line.trim())) {
			return <p key={key++}>
				<a target="_blank" href={line}>
					{line}
					<img key={key++} src={line.trim()} width="100%" alt="圖片" />
				</a>
			</p>;
		} else {
			return <p key={key++}>
				<ShowLine line={line} />
			</p>;
		}
	})}
	</>;
}
