import {BPMN_BE, BPMN_BEE, BPMN_SEQUENCE_FLOW} from "../util/Constants";

export class BoundaryEventExtractor {

    getType() {
        return BPMN_BE;
    }

    extractSimplified(element) {
        if (!element.eventDefinitions || element.eventDefinitions.length === 0) {
            throw BPMN_BE + ' with id: ' + element.id + ' has no event definition';
        }

        if (element.eventDefinitions[0].$type === BPMN_BEE) {            
            if (! (element.outgoing && element.outgoing.length === 1)) {
                throw 'The ' + BPMN_BE + ' with id: ' + element.id + ' must have at least one outgoing ' + BPMN_SEQUENCE_FLOW;
            }

            return {
                id: element.id,
                $type: BPMN_BEE,
                name: element.name ? element.name : '',
                incoming: element.attachedToRef.id,
                outgoing: element.outgoing[0]
            };
        }

        throw 'Unsupported element with id: ' + element.id + ' and type: ' + element.$type; 
    }
}