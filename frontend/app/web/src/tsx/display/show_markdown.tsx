import * as React from 'react';
import { marked } from 'marked';
import '../../css/markdown.css';

import Prism from 'prismjs';

const renderer = {
	heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6) {
		const escaped_text = text.replace(/[\s]+/g, '_');
		const new_level = level <= 5 ? level + 1 : level;
		if (level == 1) {
			return `
            <h${new_level}>
              <a name="${escaped_text}" class="anchor" href="#${escaped_text}">
                <span class="header-link">⚓</span>
              </a>
              ${text}
            </h${new_level}>`;
		} else {
			return `<h${new_level}>
              ${text}
            </h${new_level}>`;
		}
	},
	link(href: string | null, _title: string | null, text: string) {
		return `<a href="${href}" target="_blank">${text}</a>`;
	}
};

marked.use({
	gfm: true,
	breaks: true,
	renderer,
	highlight:  function(code: string, lang: string) {
		if (lang && Prism.languages[lang]) {
			try {
				return Prism.highlight(code, Prism.languages[lang], lang);
			} catch (__) {
				return code;
			}
		}
		return code;
	}
});

export function ShowMarkdown(props: {
    text: string
}): JSX.Element {
	return <div
		className="markdown"
		dangerouslySetInnerHTML={{
			__html: marked.parse(props.text)
		}}>
	</div>;
}