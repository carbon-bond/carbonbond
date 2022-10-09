import * as React from 'react';
import MarkDownIt from 'markdown-it';
import '../../css/markdown.css';

import Prism from 'prismjs';

const markdown_it = new MarkDownIt({
	breaks: true,
	linkify: true,
	highlight: function (str, lang) {
		if (lang && Prism.languages[lang]) {
			try {
				return Prism.highlight(str, Prism.languages[lang], lang);
			} catch (__) { }
		}
		return '';
	}
});

// 給 <a> 加上 <a target="_blank"> ，讓使用者點擊時開啓新分頁，而不用離開碳鍵
const linkOpenDefaultRender = markdown_it.renderer.rules.link_open || function (tokens, idx, options, _env, self) {
	return self.renderToken(tokens, idx, options);
};

markdown_it.renderer.rules.link_open = function (tokens, idx, options, env, self) {
	const aIndex = tokens[idx].attrIndex('target');

	if (aIndex < 0) {
		tokens[idx].attrPush(['target', '_blank']);
	} else {
		tokens[idx].attrs![aIndex][1] = '_blank';
	}

	return linkOpenDefaultRender(tokens, idx, options, env, self);
};

// heading 等級從 h2 開始，以免 h1 被搜尋引擎誤認爲標題
// h6 則維持 h6
// h1 => h2, h2 => h3, h4 => h5, .... , h6 => h6
const headingOpenDefaultRender = markdown_it.renderer.rules.heading_open || function (tokens, idx, options, _env, self) {
	return self.renderToken(tokens, idx, options);
};

markdown_it.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
	const level = parseInt(tokens[idx].tag.slice(1));

	const new_level = level <= 5 ? level + 1 : 6;

	tokens[idx].tag = `h${new_level}`;

	return headingOpenDefaultRender(tokens, idx, options, env, self);
};

export function ShowMarkdown(props: {
    text: string
}): JSX.Element {
	return <div
		className="markdown"
		dangerouslySetInnerHTML={{
			__html: markdown_it.render(props.text)
		}}>
	</div>;
}