import {BPMN_BEE, BPMN_END_EVENT, BPMN_SEQUENCE_FLOW} from "../util/Constants";

export class EndEventExtractor { 
    
    getType() {
        return BPMN_END_EVENT;
    }

    extractSimplified(element) {
        if (! (element.incoming && element.incoming.length === 1)) {
            throw 'The ' + BPMN_END_EVENT + ' with id: ' + element.id + ' must have one incoming ' + BPMN_SEQUENCE_FLOW;
        }

        let isErrorEndEvent = false;
        if (element.eventDefinitions && element.eventDefinitions.length === 1 && element.eventDefinitions[0].$type === BPMN_BEE) {
            isErrorEndEvent = true;
        }

        return {
            id: element.id,
            $type: element.$type,
            name: element.name ? element.name : '',
            incoming: element.incoming[0].id,
            isErrorEndEvent: isErrorEndEvent
        };
    }
}