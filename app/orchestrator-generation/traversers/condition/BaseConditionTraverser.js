/**
 * Provide the ability to traverse a conditional construct by constituent elements.
 */
export class BaseConditionTraverser {

    constructor() {
        this.visitedVariables = [];
    }

    getVisitedVariables() {
        return this.visitedVariables;
    }

    indent(num) {
        return '  '.repeat(num);
    }

    /**
     * Traverse a conditional expression composed of comparisons and boolean operators.
     * Call a specific traversal method for each specific circumstance
     * and provide entry points for the orchestrator condition generation to override.
     */
    traverseCondition(condition, element) {
        if (Object.keys(condition).length !== 1) {
            throw 'Element with id: ' + element.getId() + ' must have one root element ' + JSON.stringify(condition);
        }
        
        for (let key in condition) {
            if (key === 'comparison') {
                this.traverseComparison(condition[key], element);
            } else if (key === 'and') {
                this.traverseAnd(condition[key], element);
            } else if (key === 'or') {
                this.traverseOr(condition[key], element);
            } else if (key === 'not') {
                this.traverseNot(condition[key], element);
            } else {
                throw 'Element with id: ' +  element.getId() + ' - unsupported element: ' + key + ' in condition: ' + JSON.stringify(condition);
            }
        }
    }

    traverseAnd(and, element) {
        this.enterAnd();

        if (Object.keys(and).length < 2) {
            throw 'Element with id: ' + element.getId() + ' - and condition must have at least two children' + JSON.stringify(and);
        }

        const keys = Object.keys(and);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            if (key === 'comparison') {
                this.traverseComparison(and[key], element);
            } else if (key === 'or') {
                this.traverseOr(and[key], element);
            } else if (key === 'not') {
                this.traverseNot(and[key], element);
            } else {
                throw 'Element with id: ' +  element.getId() + ' - unsupported element: ' + key + ' in and condition: ' + JSON.stringify(and);
            }

            if (i < keys.length -1) {
                this.separateAnd();
            }
        }

        this.exitAnd();
    }

    enterAnd() {

    }

    separateAnd() {

    }

    exitAnd() {

    }

    traverseOr(or, element) {
        this.enterOr();

        if (Object.keys(or).length < 2) {
            throw 'Element with id: ' + element.getId() + ' - or condition must have at least two children' + JSON.stringify(or);
        }

        const keys = Object.keys(or);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            if (key === 'comparison') {
                this.traverseComparison(or[key], element);
            } else if (key === 'and') {
                this.traverseAnd(or[key], element);
            } else if (key === 'not') {
                this.traverseNot(or[key], element);
            } else {
                throw 'Element with id: ' +  element.getId() + ' - unsupported element: ' + key + ' in and condition: ' + JSON.stringify(or);
            }

            if (i < keys.length -1) {
                this.separateOr();
            }
        }
        
        this.exitOr();
    }

    enterOr() {

    }

    separateOr() {

    }

    exitOr() {

    }

    traverseNot(not, element) {
        this.enterNot();

        if (Object.keys(not).length !== 1) {
            throw 'Element with id: ' + element.getId() + ' - not condition must have one child' + JSON.stringify(not);
        }

        for (let key in not) {
            if (key === 'comparison') {
                this.traverseComparison(not[key], element);
            } else if (key === 'and') {
                this.traverseAnd(not[key], element);
            } else if (key === 'or') {
                this.traverseOr(not[key], element);
            } else {
                throw 'Element with id: ' +  element.getId() + ' - unsupported element: ' + key + ' in not condition: ' + JSON.stringify(not);
            }
        }

        this.exitNot();
    }

    enterNot() {

    }

    exitNot() {

    }

    getVariable(comparison, element) {
        if (!comparison.attributes || !comparison.attributes.variable || ! typeof comparison.attributes.variable === 'string') {
            throw 'Element with id: ' +  element.getId() + ' - variable in comparison is neither present nor a string: ' + JSON.stringify(comparison);
        }

        return comparison.attributes.variable;
    }

    appendVisitedVariable(variable, element) {
        if (variable && typeof variable === 'string' && /[A-Za-z](\.[A-Za-z][A-Za-z0-9]|[A-Za-z0-9])*/g.test(variable)) {
            this.visitedVariables.push(variable);
        } else {
            throw 'Element with id: ' +  element.getId() + ' - variable: ' + variable + ' does not have a valid name of only letters, numbers and underscores';
        }
    }

    validateTypeIsBoolean(value, element) {
        if (typeof value !== 'boolean') {
            throw 'Element with id: ' +  element.getId() + ' - value: ' + value + ' is not boolean';
        }
    }

    validateTypeIsNumber(value, element) {
        if (typeof value !== 'number') {
            throw 'Element with id: ' +  element.getId() + ' - value: ' + value + ' is not number';
        }
    }

    validateTypeIsString(value, element) {
        if (typeof value !== 'string') {
            throw 'Element with id: ' +  element.getId() + ' - value: ' + value + ' is not string';
        }
    }

    escapeString(string) {
        return string.replace('\\', '\\\\').replace('"', '\\"');
    }

    traverseComparison(comparison, element) {
        if (Object.keys(comparison).length !== 2) { // seconds is element holding attributes
            throw 'Element with id: ' + element.getId() + ' - comparison must have one child' + JSON.stringify(comparison);
        }

        let variable = this.getVariable(comparison, element);
        this.appendVisitedVariable(variable, element);

        for (let key in comparison) {
            if (key === 'BooleanEqualTo') {
                this.validateTypeIsBoolean(comparison[key], element);
                this.handleBooleanEqualTo(variable, comparison[key]);
            } else if (key === 'NumberEqualTo') {
                this.validateTypeIsNumber(comparison[key], element);
                this.handleNumberEqualTo(variable, comparison[key]);
            } else if (key === 'NumberGreaterThan') {
                this.validateTypeIsNumber(comparison[key], element);
                this.handleNumberGreaterThan(variable, comparison[key]);
            } else if (key === 'NumberGreaterThanOrEqualTo') {
                this.validateTypeIsNumber(comparison[key], element);
                this.handleNumberGreaterThanOrEqualTo(variable, comparison[key]);
            } else if (key === 'NumberLessThan') {
                this.validateTypeIsNumber(comparison[key], element);
                this.handleNumberLessThan(variable, comparison[key]);
            } else if (key === 'NumberLessThanOrEqualTo') {
                this.validateTypeIsNumber(comparison[key], element);
                this.handleNumberLessThanOrEqualTo(variable, comparison[key]);
            } else if (key === 'StringEqualTo') { // 
                this.validateTypeIsString(comparison[key], element);
                this.handleStringEqualTo(variable, this.escapeString(comparison[key]));
            } else if (key === 'StringGreaterThan') {
                this.validateTypeIsString(comparison[key], element);
                this.handleStringGreaterThan(variable, this.escapeString(comparison[key]));
            } else if (key === 'StringGreaterThanOrEqualTo') {
                this.validateTypeIsString(comparison[key], element);
                this.handleStringGreaterThanOrEqualTo(variable, this.escapeString(comparison[key]));
            } else if (key === 'StringLessThan') {
                this.validateTypeIsString(comparison[key], element);
                this.handleStringLessThan(variable, this.escapeString(comparison[key]));
            } else if (key === 'StringLessThanOrEqualTo') {
                this.validateTypeIsString(comparison[key], element);
                this.handleStringLessThanOrEqualTo(variable, this.escapeString(comparison[key]));
            } else if (key === 'BooleanEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleBooleanEqualToPath(variable, comparison[key]);
            } else if (key === 'NumberEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleNumberEqualToPath(variable, comparison[key]);
            } else if (key === 'NumberGreaterThanPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleNumberGreaterThanPath(variable, comparison[key]);
            } else if (key === 'NumberGreaterThanOrEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleNumberGreaterThanOrEqualToPath(variable, comparison[key]);
            } else if (key === 'NumberLessThanPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleNumberLessThanPath(variable, comparison[key]);
            } else if (key === 'NumberLessThanOrEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleNumberLessThanOrEqualToPath(variable, comparison[key]);
            } else if (key === 'StringEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleStringEqualToPath(variable, comparison[key]);
            } else if (key === 'StringGreaterThanPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleStringGreaterThanPath(variable, comparison[key]);
            } else if (key === 'StringGreaterThanOrEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleStringGreaterThanOrEqualToPath(variable, comparison[key]);
            } else if (key === 'StringLessThanPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleStringLessThanPath(variable, comparison[key]);
            } else if (key === 'StringLessThanOrEqualToPath') {
                this.appendVisitedVariable(comparison[key]);
                this.handleStringLessThanOrEqualToPath(variable, comparison[key]);
            } else if (key === 'attributes') {
                // attributes key holds the xml attributes; skip
            } else {
                throw 'Element with id: ' +  element.getId() + ' - unsupported element: ' + key + ' in not comparison: ' + JSON.stringify(comparison);
            }
        }
    }

    handleBooleanEqualTo(variable, value) {

    }

    handleNumberEqualTo(variable, value) {

    }

    handleNumberGreaterThan(variable, value) {

    }

    handleNumberGreaterThanOrEqualTo(variable, value) {

    }

    handleNumberLessThan(variable, value) {

    }

    handleNumberLessThanOrEqualTo(variable, value) {

    }

    handleStringEqualTo(variable, value) {

    }

    handleStringGreaterThan(variable, value) {

    }

    handleStringGreaterThanOrEqualTo(variable, value) {

    }

    handleStringLessThan(variable, value) {

    }

    handleStringLessThanOrEqualTo(variable, value) {

    }

    handleBooleanEqualToPath(variable, variable2) {

    }

    handleNumberEqualToPath(variable, variable2) {

    }

    handleNumberGreaterThanPath(variable, variable2) {

    }

    handleNumberGreaterThanOrEqualToPath(variable, variable2) {

    }

    handleNumberLessThanPath(variable, variable2) {

    }

    handleNumberLessThanOrEqualToPath(variable, variable2) {

    }

    handleStringEqualToPath(variable, variable2) {

    }

    handleStringGreaterThanPath(variable, variable2) {

    }

    handleStringGreaterThanOrEqualToPath(variable, variable2) {

    }

    handleStringLessThanPath(variable, variable2) {

    }

    handleStringLessThanOrEqualToPath(variable, variable2) {

    }
}