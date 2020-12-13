import {PARALLEL_BLOCK} from '../util/Constants';
import {BaseControlFlowElement} from './BaseControlFlowElement';

export class ParallelBlock extends BaseControlFlowElement {
    
    constructor(id, name, inputSchema, outputSchema, branchSequenceBlocks) {
        super(PARALLEL_BLOCK, id, name, inputSchema, outputSchema);
        this.branchSequenceBlocks = branchSequenceBlocks;
    }

    getBranchSequenceBlocks() {
        return this.branchSequenceBlocks;
    }
}