import {
    BPMN_LOOP,
    BPMN_MULTI_INSTANCE,
    BPMN_SUB_PROCESS,
    BPMN_TASK,
    DEFAULT_BRANCH,
    DEFAULT_COMPOSER_TIMEOUT_MINIMUM,
    DEFAULT_DURABLE_FUNCTIONS_TIMEOUT
} from "./Constants";

export function isOpening(element) {
    return element.incoming && element.incoming.length && element.incoming.length === 1
        && element.outgoing && element.outgoing.length && element.outgoing.length >= 1;
}

export function isClosing(element) {
    return element.incoming && element.incoming.length && element.incoming.length >= 1
        && element.outgoing && element.outgoing.length && element.outgoing.length === 1;
}

export function isLoop(element) {
    return element.loopCharacteristics && element.loopCharacteristics.$type === BPMN_LOOP;
}

export function isFanout(element) {
    return element.loopCharacteristics && element.loopCharacteristics.$type === BPMN_MULTI_INSTANCE && !element.loopCharacteristics.isSequential;
}

export function validateNoSequential(element) {
    if (element.loopCharacteristics && element.loopCharacteristics.isSequential) {
        throw 'The element with id: ' + element.id + ' must not have a sequential ' + BPMN_MULTI_INSTANCE + ' marker';
    }
}

export function validateName(element) {
    if (!(element.name && element.name.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/i) && element.name.length > 1 && element.name.length <= 60)) {
        throw 'The element with id: ' + element.id + ' must have a valid name, composed of letters, numbers, underscores and be between 2-60 characters';
    }
}

export function validateActivityDoesNotLoopToSelf(element, process) {
    if (element.outgoing) {
        const nextElement = process.elements[process.elements[element.outgoing].outgoing];
        if (nextElement.$type === BPMN_TASK || nextElement.$type === BPMN_SUB_PROCESS) {
            if (nextElement.id === element.id) {
                throw 'The element with id: ' + element.id + ' must not point to itself';
            }
        }
    }
}

export function validateAllElementsAreSame(elements) {
    if (elements && elements.length > 1) {
        let prev = elements[0];
        for (let i = 1; i < elements.length; i++) {
            if (prev.id !== elements[i].id) {
                throw 'Elements are not the same: ' + prev.id + ' and ' + elements[i].id;
            }
            prev = elements[i];
        }
    }
}

export function validateBranchName(element) {
    if (!(element.name.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/i) && !(element.name.startsWith(DEFAULT_BRANCH) && element.name.length > 7))) {
        throw 'Element with id: ' + element.id + ' has invalid branch name: ' + name;
    }
}

export function validateNoDuplicateNames(names) {
    let visited = [];
    if (names) {
        for (let name of names) {
            if (visited.includes(name)) {
                throw 'Duplicate names found: ' + name;
            }
            visited.push(name);
        }
    }
}

export function validateRetryCount(retryCount, elementId) {
    if (retryCount) {
        if (!(retryCount >= 0)) {
            throw 'Retry count: ' + retryCount + ' invalid of element with id: ' + elementId;
        }
    }
}

export function validateTimeout(timeoutMillis, elementId) {
    if (timeoutMillis) {  // openwhisk max range of 300.000 ms and default of durable functions (also 300.000 for consumption plan)
        if (!(timeoutMillis > DEFAULT_COMPOSER_TIMEOUT_MINIMUM && timeoutMillis <= DEFAULT_DURABLE_FUNCTIONS_TIMEOUT)) {
            throw 'Timeout: ' + timeoutMillis + ' invalid of element with id: ' + elementId;
        }
    }
}