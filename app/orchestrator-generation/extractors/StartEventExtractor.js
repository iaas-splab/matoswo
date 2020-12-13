import {BPMN_SEQUENCE_FLOW, BPMN_START_EVENT} from "../util/Constants";

export class StartEventExtractor {

    getType() {
        return BPMN_START_EVENT;
    }

    extractSimplified(element) {
        if (! (element.outgoing && element.outgoing.length === 1)) {
            throw 'The ' + this.getType() + ' with id: ' + element.id + ' must have exactly one outgoing ' + BPMN_SEQUENCE_FLOW;
        }

        return {
            id: element.id,
            $type: element.$type,
            name: element.name ? element.name : '',
            outgoing: element.outgoing[0].id
        };
    }
}