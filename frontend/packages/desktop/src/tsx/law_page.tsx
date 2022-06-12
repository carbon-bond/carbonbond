import * as React from 'react';

import style from '../css/law_page.module.css';

import { ReactComponent as TermsComponent } from '../md/law/服務條款.md';
import { ReactComponent as RulesComponent } from '../md/law/論壇守則.md';
import { ReactComponent as BoardComponent } from '../md/law/看板和活動政策.md';
import { ReactComponent as BrandComponent } from '../md/law/品牌使用準則.md';

import {
	Routes,
	Route,
} from 'react-router-dom';

function LawPage(): JSX.Element {
	return <div className={style.lawPage}>
		<div>
			<Routes>
				<Route path={encodeURIComponent('服務條款.md')} element={<TermsComponent />} />
				<Route path={encodeURIComponent('論壇守則.md')} element={<RulesComponent />} />
				<Route path={encodeURIComponent('看板和活動政策.md')} element={<BoardComponent />} />
				<Route path={encodeURIComponent('品牌使用準則.md')} element={<BrandComponent />} />
			</Routes>
		</div>
	</div>;
}

export { LawPage };