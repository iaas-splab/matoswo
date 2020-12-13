import {LOOP_BLOCK} from '../util/Constants';
import {BaseControlFlowElement} from './BaseControlFlowElement';

export class LoopBlock extends BaseControlFlowElement {
    
    constructor(id, name, inputSchema, outputSchema, loopCondition, sequenceBlock) {
        super(LOOP_BLOCK, id, name, inputSchema, outputSchema);
        this.loopCondition = loopCondition;
        this.sequenceBlock = sequenceBlock;
        this.lastElementInSeq = this.sequenceBlock.getSequence()[this.sequenceBlock.getSequence().length - 1];
    }

    getLoopCondition() {
        return this.loopCondition;
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