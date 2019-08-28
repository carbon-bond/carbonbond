'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const graphql = require('graphql');
const { DocumentMode, ClientSideBaseVisitor } = require('@graphql-codegen/visitor-plugin-common');
const { toPascalCase } = require('@graphql-codegen/plugin-helpers');
const autoBind = require('auto-bind');
const graphql_tag = require('graphql-tag');

class AjaxVisitor extends ClientSideBaseVisitor {
	constructor(fragments, rawConfig) {
		super(fragments, rawConfig, { });
		autoBind(this);
		this.documentString = '';
	}
	_buildAjaxFunc(node, documentVariableName, _operationType, operationResultType, operationVariablesTypes) {
		const isVariablesRequired = node.variableDefinitions.some(variableDef => variableDef.type.kind === graphql.Kind.NON_NULL_TYPE);
		/*if (_operationType === 'Subscription') {
			generics.unshift(operationResultType);
		}*/
		return `
	public async ${node.name.value}(
		variables${isVariablesRequired ? '' : '?'}: ${operationVariablesTypes}
	): Promise<${operationResultType}> {
		return await this.fetcher(${documentVariableName}, variables) as ${operationResultType};
	}`
		;
	}
	buildOperation(node, documentVariableName, operationType, operationResultType, operationVariablesTypes) {
		return this._buildAjaxFunc(node, documentVariableName, operationType, operationResultType, operationVariablesTypes);
	}

	_gql(node) {
		const doc = this._prepareDocument(`
    ${graphql.print(node)}
    ${this._includeFragments(this._transformFragments(node))}`);
		if (this.config.documentMode === DocumentMode.documentNode) {
			const gqlObj = graphql_tag.default(doc);
			if (gqlObj && gqlObj['loc']) {
				delete gqlObj.loc;
			}
			return JSON.stringify(gqlObj);
		}
		return '`' + doc + '`';
	}

	OperationDefinition(node) {
		if (!node.name || !node.name.value) {
			return null;
		}
		this._collectedOperations.push(node);
		const documentVariableName = this.convertName(node, {
			suffix: this.config.documentVariableSuffix,
			prefix: this.config.documentVariablePrefix,
			transformUnderscore: this.config.transformUnderscore,
			useTypesPrefix: false,
		});
		let documentString = '';
		if (this.config.documentMode !== DocumentMode.external) {
			documentString = `${this.config.noExport ? '' : 'export'} const ${documentVariableName}${this.config.documentMode === DocumentMode.documentNode ? ': DocumentNode' : ''} = ${this._gql(node)};`;
		}
		this.documentString += documentString + '\n';
		const operationType = toPascalCase(node.operation);
		const operationTypeSuffix = this.config.dedupeOperationSuffix && node.name.value.toLowerCase().endsWith(node.operation) ? '' : operationType;
		const operationResultType = this.convertName(node, {
			suffix: operationTypeSuffix + this._parsedConfig.operationResultSuffix,
			transformUnderscore: this.config.transformUnderscore,
		});
		const operationVariablesTypes = this.convertName(node, {
			suffix: operationTypeSuffix + 'Variables',
			transformUnderscore: this.config.transformUnderscore,
		});
		const additional = this.buildOperation(node, documentVariableName, operationType, operationResultType, operationVariablesTypes);

		return additional;
	}
}

exports.AjaxVisitor = AjaxVisitor;

exports.plugin = (_schema, documents, config) => {
	const allAst = graphql.concatAST(documents.map(v => v.content));
	const allFragments = [
		...allAst.definitions.filter(d => d.kind === graphql.Kind.FRAGMENT_DEFINITION).map(fragmentDef => ({ node: fragmentDef, name: fragmentDef.name.value, onType: fragmentDef.typeCondition.name.value, isExternal: false })),
		...(config.externalFragments || []),
	];
	const visitor = new AjaxVisitor(allFragments, config);
	const visitorResult = graphql.visit(allAst, { leave: visitor });

	let content = `
${visitor.fragments}
${visitor.documentString}
export class AjaxOperation {
	constructor(private fetcher: (query: string, variables?: Object) => Promise<any>) { }
${visitorResult.definitions.filter(t => typeof t === 'string').join('\n')}
}
	`;

	return {
		content
	};
};

