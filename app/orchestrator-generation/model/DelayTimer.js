import {DELAY_TIMER} from "../util/Constants";
import {BaseControlFlowElement} from "./BaseControlFlowElement";

export class DelayTimer extends BaseControlFlowElement {

    constructor(id, name, inputSchema, outputSchema, milliseconds) {
        super(DELAY_TIMER, id, name, inputSchema, outputSchema);
        this.milliseconds = milliseconds;
    }

    getMilliseconds() {
        return this.milliseconds;
    }
}