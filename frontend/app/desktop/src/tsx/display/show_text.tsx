import * as React from 'react';
import { ShowMarkdown } from './show_markdown';
import { ShowPureText } from './show_pure_text';

export enum Format {
	PureText,
	Markdown,
}

export function ShowText(props: {
    text: string,
    format: Format
}): JSX.Element {
	switch (props.format) {
		case Format.PureText:
			return <ShowPureText text={props.text} />;
		case Format.Markdown:
			return <ShowMarkdown text={props.text} />;
	}
}
