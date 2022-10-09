import * as React from 'react';
import { ShowMarkdown } from './show_markdown';
import { ShowText } from './show_text';

export enum Format {
	PureText,
	Markdown,
}

export function ShowMultipleLine(props: {
    text: string,
    format: Format
}): JSX.Element {
	switch (props.format) {
		case Format.PureText:
			return <ShowText text={props.text} />;
		case Format.Markdown:
			return <ShowMarkdown text={props.text} />;
	}
}
