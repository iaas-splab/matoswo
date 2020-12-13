import {BaseConditionTraverser} from "../BaseConditionTraverser";

/**
 * Provide the ability to traverse a conditional construct and generate a Step Functions json-style boolean expression.
 */
export class StepFunctionsConditionGenerator extends BaseConditionTraverser {

    constructor(indentation) {
        super();
        this.generated = '';
        this.indentation = indentation;
        this.indentationLevel = 0;
    }

    getGenerated() {
        return this.generated;
    }

    enterAnd() {
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '"And": [';
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '{';
    }

    separateAnd() {
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '},';
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '{';
    }

    exitAnd() {
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '}';
        this.generated += '\n' + this.indentation + this.indent(--this.indentationLevel) + ']';
        this.indentationLevel--;
    }

    enterOr() {
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '"Or": [';
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '{';
    }

    separateOr() {
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '},';
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '{';
    }

    exitOr() {
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '}';
        this.generated += '\n' + this.indentation + this.indent(--this.indentationLevel) + ']';
        this.indentationLevel--;
    }

    enterNot() {
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '"Not" : {';
    }

    exitNot() {
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '}';
        this.indentationLevel--;
    }

    generateComparison(variable, value, comparator) {
        this.generated += '\n' + this.indentation + this.indent(++this.indentationLevel) + '"Variable": "$.' + variable + '",';
        this.generated += '\n' + this.indentation + this.indent(this.indentationLevel) + '"' + comparator + '": ' + value;
        this.indentationLevel--;
    }

    handleBooleanEqualTo(variable, value) {
        this.generateComparison(variable, value, 'BooleanEquals');
    }

    handleNumberEqualTo(variable, value) {
        this.generateComparison(variable, value, 'NumericEquals');
    }

    handleNumberGreaterThan(variable, value) {
        this.generateComparison(variable, value, 'NumericGreaterThan');
    }

    handleNumberGreaterThanOrEqualTo(variable, value) {
        this.generateComparison(variable, value, 'NumericGreaterThanEquals');
    }

    handleNumberLessThan(variable, value) {
        this.generateComparison(variable, value, 'NumericLessThan');
    }

    handleNumberLessThanOrEqualTo(variable, value) {
        this.generateComparison(variable, value, 'NumericLessThanEquals');
    }

    handleStringEqualTo(variable, value) {
        this.generateComparison(variable, '"' + value + '"', 'StringEquals');
    }

    handleStringGreaterThan(variable, value) {
        this.generateComparison(variable, '"' + value + '"', 'StringGreaterThan');
    }

    handleStringGreaterThanOrEqualTo(variable, value) {
        this.generateComparison(variable, '"' + value + '"', 'StringGreaterThanEquals');
    }

    handleStringLessThan(variable, value) {
        this.generateComparison(variable, '"' + value + '"', 'StringLessThanEquals');
    }

    handleStringLessThanOrEqualTo(variable, value) {
        this.generateComparison(variable, '"' + value + '"', 'StringLessThanEquals');
    }

    handleBooleanEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'BooleanEqualsPath');
    }

    handleNumberEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'NumericEqualsPath');
    }

    handleNumberGreaterThanPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'NumericGreaterThanPath');
    }

    handleNumberGreaterThanOrEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'NumericGreaterThanEqualsPath');
    }

    handleNumberLessThanPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'NumericLessThanPath');
    }

    handleNumberLessThanOrEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'NumericLessThanEqualsPath');
    }

    handleStringEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'StringEqualsPath');
    }

    handleStringGreaterThanPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'StringGreaterThanPath');
    }

    handleStringGreaterThanOrEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'StringGreaterThanEqualsPath');
    }

    handleStringLessThanPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'StringLessThanPath');
    }

    handleStringLessThanOrEqualToPath(variable, variable2) {
        this.generateComparison(variable, '"$.' + variable2 + '"', 'StringLessThanEqualsPath');
    }
}