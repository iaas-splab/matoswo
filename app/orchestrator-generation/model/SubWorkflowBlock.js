import {SUB_WORKFLOW_BLOCK} from '../util/Constants';
import {Activity} from './Activity';

export class SubWorkflowBlock extends Activity {
    
    constructor(id, name, inputSchema, outputSchema, retryCount, timeoutMilliseconds, sequenceBlock) {
        super(SUB_WORKFLOW_BLOCK, id, name, inputSchema, outputSchema, retryCount, timeoutMilliseconds);
        this.sequenceBlock = sequenceBlock;
    }

    getSequenceBlock() {
        return this.sequenceBlock;
    }
}