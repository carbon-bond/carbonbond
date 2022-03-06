import * as React from 'react';

import style from '../css/law_page.module.css';

import { ReactComponent as TermsComponent } from '../md/服務條款.md';
import { ReactComponent as RulesComponent } from '../md/論壇守則.md';

import {
	Switch,
	Route,
} from 'react-router-dom';

function LawPage(): JSX.Element {
	return <div className={style.lawPage}>
		<div>
			<Switch>
				<Route path="/app/law/terms" render={() => (
					<TermsComponent />
				)} />
				<Route path="/app/law/rules" render={() => (
					<RulesComponent />
				)} />
			</Switch>
		</div>
	</div>;
}

export { LawPage };