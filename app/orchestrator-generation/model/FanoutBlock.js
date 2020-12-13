import {FANOUT_BLOCK} from '../util/Constants';
import {BaseControlFlowElement} from './BaseControlFlowElement';

export class FanoutBlock extends BaseControlFlowElement {
    
    constructor(id, name, inputSchema, outputSchema, sequenceBlock) {
        super(FANOUT_BLOCK, id, name, inputSchema, outputSchema);
        this.sequenceBlock = sequenceBlock;
        this.lastElementInSeq = this.sequenceBlock.getSequence()[this.sequenceBlock.getSequence().length - 1];
    }

    getSequenceBlock() {
        return this.sequenceBlock;
    }

    setErrorHandler(errorHandler) {
        this.lastElementInSeq.setErrorHandler(errorHandler);
    }

    getErrorHandler() {
        this.lastElementInSeq.getErrorHandler();
    }

    setContinueAfterError(continueAfterError) {
        this.lastElementInSeq.setContinueAfterError(continueAfterError);
    }

    getContinueAfterError() {
        return this.lastElementInSeq.getContinueAfterError();
    }
}