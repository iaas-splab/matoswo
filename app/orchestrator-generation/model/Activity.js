import {BaseControlFlowElement} from "./BaseControlFlowElement";
import {validateRetryCount, validateTimeout} from '../util/util';
import {DEFAULT_RETRY_COUNT, DEFAULT_TIMEOUT} from "../util/Constants";

export class Activity extends BaseControlFlowElement {

    constructor(type, id, name, inputSchema, outputSchema, retryCount, timeoutMilliseconds) {
        super(type, id, name, inputSchema, outputSchema);

        validateRetryCount(retryCount, id);
        this.retryCount = retryCount ? retryCount : DEFAULT_RETRY_COUNT;

        validateTimeout(timeoutMilliseconds, id);
        this.timeoutMilliseconds = timeoutMilliseconds ? timeoutMilliseconds : DEFAULT_TIMEOUT;

        this.errorHandler = false;
        this.continueAferError = false;
    }

    getRetryCount() {
        return this.retryCount;
    }

    setTimeoutMilliseconds(milliseconds) {
        this.timeoutMilliseconds = milliseconds;
    }

    getTimeoutMilliseconds() {
        return this.timeoutMilliseconds;
    }

    setErrorHandler(errorHandler) {
        this.errorHandler = errorHandler;
    }

    getErrorHandler() {
        return this.errorHandler;
    }

    setContinueAfterError(continueAfterError) {
        this.continueAferError = continueAfterError;
    }

    getContinueAfterError() {
        return this.continueAferError;
    }
}