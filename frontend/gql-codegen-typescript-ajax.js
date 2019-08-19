'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const graphql_1 = require('graphql');
const path_1 = require('path');
const visitor_plugin_common_1 = require('@graphql-codegen/visitor-plugin-common');
const autoBind = require('auto-bind');
const change_case_1 = require('change-case');

class AjaxVisitor extends visitor_plugin_common_1.ClientSideBaseVisitor {
	constructor(fragments, rawConfig) {
		super(fragments, rawConfig, { });
		autoBind(this);
	}
	_buildAjaxFunc(node, documentVariableName, operationType, operationResultType, operationVariablesTypes) {
		const funcName = this.convertName(node.name.value, { suffix: 'Ajax', useTypesPrefix: false });
		const isVariablesRequired = node.variableDefinitions.some(variableDef => variableDef.type.kind === graphql_1.Kind.NON_NULL_TYPE);
		/*if (operationType === 'Subscription') {
			generics.unshift(operationResultType);
		}*/
		return `export async function ${funcName}(
	fetcher: (query: any, variables?: Object) => Promise<any>,
	variables${isVariablesRequired ? '' : '?'}: ${operationVariablesTypes}
): Promise<${operationResultType}> {
	return await fetcher(${documentVariableName}, variables) as ${operationResultType};
}`;
	}
	buildOperation(node, documentVariableName, operationType, operationResultType, operationVariablesTypes) {
		return this._buildAjaxFunc(node, documentVariableName, operationType, operationResultType, operationVariablesTypes);
	}
}

exports.AjaxVisitor = AjaxVisitor;

exports.plugin = (schema, documents, config) => {
	const allAst = graphql_1.concatAST(documents.reduce((prev, v) => {
		return [...prev, v.content];
	}, []));
	const allFragments = [
		...allAst.definitions.filter(d => d.kind === graphql_1.Kind.FRAGMENT_DEFINITION).map(fragmentDef => ({ node: fragmentDef, name: fragmentDef.name.value, onType: fragmentDef.typeCondition.name.value, isExternal: false })),
		...(config.externalFragments || []),
	];
	const visitor = new AjaxVisitor(allFragments, config);
	const visitorResult = graphql_1.visit(allAst, { leave: visitor });
	return {
		prepend: visitor.getImports(),
		content: [visitor.fragments, ...visitorResult.definitions.filter(t => typeof t === 'string')].join('\n'),
	};
};
