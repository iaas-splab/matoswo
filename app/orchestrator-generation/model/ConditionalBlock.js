import {CONDITIONAL_BLOCK} from '../util/Constants';
import {BaseControlFlowElement} from './BaseControlFlowElement';

export class ConditionalBlock extends BaseControlFlowElement {
    
    constructor(id, name, inputSchema, outputSchema, branchSequenceBlocks, branchConditions) {
        super(CONDITIONAL_BLOCK, id, name, inputSchema, outputSchema);
        this.branchSequenceBlocks = branchSequenceBlocks;
        this.branchConditions = branchConditions;
    }

    getBranchSequenceBlocks() {
        return this.branchSequenceBlocks;
    }

    getBranchConditions() {
        return this.branchConditions;
    }
}