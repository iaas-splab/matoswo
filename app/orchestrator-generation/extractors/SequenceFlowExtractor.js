import {BPMN_SEQUENCE_FLOW} from "../util/Constants";

export class SequenceFlowExtractor {

    getType() {
        return BPMN_SEQUENCE_FLOW;
    }

    extractSimplified(element) {
        return {
            id: element.id,
            name: element.name ? element.name : '',
            $type: element.$type,
            incoming: element.sourceRef.id,
            outgoing: element.targetRef.id,
        };
    }
}