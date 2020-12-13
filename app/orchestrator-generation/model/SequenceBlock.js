import {SEQUENCE_BLOCK} from '../util/Constants';
import {BaseControlFlowElement} from './BaseControlFlowElement';

export class SequenceBlock extends BaseControlFlowElement {
    
    constructor(id, name, inputSchema, outputSchema, sequence) {
        super(SEQUENCE_BLOCK, id, name, inputSchema, outputSchema);
        this.sequence = sequence;
    }

    getSequence() {
        return this.sequence;
    }

    getFirstElement() {
        if(this.sequence.size < 1) {
            return false;
        }

        return this.sequence[0];
    }
}