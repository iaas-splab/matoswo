import {BPMN_IE, BPMN_IET, BPMN_SEQUENCE_FLOW} from "../util/Constants";

export class IntermediateEventExtract {

    getType() {
        return BPMN_IE;
    }

    extractSimplified(element) {
        if (!element.eventDefinitions || element.eventDefinitions.length === 0) {
            throw BPMN_IE + ' with id: ' + element.id + ' has no event definition';
        }

        if (element.eventDefinitions[0].$type === BPMN_IET) {
            if(! (element.incoming && element.incoming.length === 1 && element.outgoing && element.outgoing.length === 1)) {
                throw 'The ' + BPMN_IE + ' with id: ' + element.id + ' must have one exactly one incoming and outgoing ' + BPMN_SEQUENCE_FLOW;
            }

            if (!element.milliseconds) {
                throw 'The ' + BPMN_IE + ' with id: ' + element.id + ' has no time specified'; 
            }

            return {
                id: element.id,
                $type: BPMN_IET,
                name: element.name ? element.name : '',
                incoming: element.incoming[0].id,
                outgoing: element.outgoing[0].id,
                inputSchema: element.inputSchema,
                outputSchema: element.inputSchema, // no modifications to output, so just take the in schema as out schema
                milliseconds: element.milliseconds
            };
        }

        throw 'Unsupported element with id: ' + element.id + ' and type: ' + element.eventDefinitions[0].$type; 
    }
}