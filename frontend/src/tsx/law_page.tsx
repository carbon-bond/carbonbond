import * as React from 'react';

import style from '../css/law_page.module.css';

import { ReactComponent as TermsComponent } from '../md/law/服務條款.md';
import { ReactComponent as RulesComponent } from '../md/law/論壇守則.md';

import {
	Routes,
	Route,
} from 'react-router-dom';

function LawPage(): JSX.Element {
	return <div className={style.lawPage}>
		<div>
			<Routes>
				<Route path="terms" element={<TermsComponent />} />
				<Route path="rules" element={<RulesComponent />} />
			</Routes>
		</div>
	</div>;
}

export { LawPage };