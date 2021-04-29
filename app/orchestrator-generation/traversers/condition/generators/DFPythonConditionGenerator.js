import {BaseConditionTraverser} from "../BaseConditionTraverser";

/**
 * Provide the ability to traverse a conditional construct and generate a JavaScript style boolean expression.
 */
export class DFPythonConditionGenerator extends BaseConditionTraverser {

    constructor(variablePrefix) {
        super();
        this.generated = '';
        this.variablePrefix = variablePrefix;
    }

    getGenerated() {
        return this.generated;
    }

    enterAnd() {
        this.generated += '('
    }

    separateAnd() {
        this.generated += ' and '
    }

    exitAnd() {
        this.generated += ')'
    }

    enterOr() {
        this.generated += '('
    }

    separateOr() {
        this.generated += ' or '
    }

    exitOr() {
        this.generated += ')'
    }

    enterNot() {
        this.generated += 'not ('
    }

    exitNot() {
        this.generated += ')'
    }

    handleBooleanEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' == ' + value;
    }

    handleNumberEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' == ' + value;
    }

    handleNumberGreaterThan(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' > ' + value;
    }

    handleNumberGreaterThanOrEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' >= ' + value;
    }

    handleNumberLessThan(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' < ' + value;
    }

    handleNumberLessThanOrEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' <= ' + value;
    }

    handleStringEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' == "' + value + '"';
    }

    handleStringGreaterThan(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' > "' + value + '"';
    }

    handleStringGreaterThanOrEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' >= "' + value + '"';
    }

    handleStringLessThan(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' < "' + value + '"';
    }

    handleStringLessThanOrEqualTo(variable, value) {
        this.generated += this.variablePrefix + '.' + variable + ' <= "' + value + '"';
    }

    handleBooleanEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' == ' + this.variablePrefix + '.' + variable2;
    }

    handleNumberEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' == ' + this.variablePrefix + '.' + variable2;
    }

    handleNumberGreaterThanPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' > ' + this.variablePrefix + '.' + variable2;
    }

    handleNumberGreaterThanOrEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' >= ' + this.variablePrefix + '.' + variable2;
    }

    handleNumberLessThanPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' < ' + this.variablePrefix + '.' + variable2;
    }

    handleNumberLessThanOrEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' <= ' + this.variablePrefix + '.' + variable2;
    }

    handleStringEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' == ' + this.variablePrefix + '.' + variable2;
    }

    handleStringGreaterThanPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' > ' + this.variablePrefix + '.' + variable2;
    }

    handleStringGreaterThanOrEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' >= ' + this.variablePrefix + '.' + variable2;
    }

    handleStringLessThanPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' < ' + this.variablePrefix + '.' + variable2;
    }

    handleStringLessThanOrEqualToPath(variable, variable2) {
        this.generated += this.variablePrefix + '.' + variable + ' <= ' + this.variablePrefix + '.' + variable2;
    }
}
