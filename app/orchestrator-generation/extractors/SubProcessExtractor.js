import {BPMN_SEQUENCE_FLOW, BPMN_SUB_PROCESS} from "../util/Constants";
import {isFanout, isLoop, validateName, validateNoSequential} from '../util/util';
import {ProcessExtractor} from './ProcessExtractor';
import {extractCondition} from './XmlConditionExtraction';

export class SubProcessExtractor {
    
    getType() {
        return BPMN_SUB_PROCESS;
    }

    extractSimplified(element, supportedElements) {
        validateName(element);
        validateNoSequential(element);

        if (! ((!element.outgoing || (element.outgoing && element.outgoing.length <= 1)) && element.incoming && element.incoming.length === 1)) {
            throw 'The ' + BPMN_SUB_PROCESS + ' with id: ' + element.id + ' must have one or less outgoing and exactly one incoming ' + BPMN_SEQUENCE_FLOW;
        }

        let subProcess = false;
        if (element.flowElements && element.flowElements.length > 0) {
            subProcess = new ProcessExtractor(supportedElements).extractSimplified(element);
        }

        return {
            id: element.id,
            $type: element.$type,
            name: element.name ? element.name : '',
            incoming: element.incoming[0].id,
            outgoing: element.outgoing && element.outgoing.length > 0 ? element.outgoing[0].id : false,
            inputSchema: element.inputSchema,
            outputSchema: element.outputSchema,
            isFanout: isFanout(element),
            isLoop: isLoop(element),
            loopCondition: isLoop(element) ? extractCondition(element.loopCondition, element) : false,
            retryCount: element.retryCount, 
            timeoutMilliseconds: element.timeoutMilliseconds,
            content: subProcess // false means subProcess is assumed to be predefined
        };
    }
}