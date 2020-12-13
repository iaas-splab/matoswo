import {TASK} from '../util/Constants';
import {Activity} from './Activity';

export class Task extends Activity {

    constructor(id, name, inputSchema, outputSchema, retryCount, timeoutMilliseconds) {
        super(TASK, id, name, inputSchema, outputSchema, retryCount, timeoutMilliseconds);
    }
}