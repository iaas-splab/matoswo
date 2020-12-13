import {BPMN_EXCL_GW} from "../util/Constants";
import {extractBranchConditions} from './XmlConditionExtraction';
import {isClosing, isOpening} from "../util/util";

export class ExclusiveGatewayExtractor {
    
    getType() {
        return BPMN_EXCL_GW;
    }

    extractSimplified(element) {
        if (!isOpening(element) && !isClosing(element)) {
            throw 'The ' + BPMN_EXCL_GW + ' with id: ' + element.id + ' must be either opening or closing';
        }

        return {
            id: element.id,
            $type: element.$type,
            name: element.name ? element.name : '',
            incoming: element.incoming.map(x => x.id),
            outgoing: element.outgoing.map(x => x.id),
            inputSchema: isOpening(element) ? element.inputSchema : element.outputSchema, // if we have opening gw we use  the schema as input and output of the gw
            outputSchema: isOpening(element) ? element.inputSchema : element.outputSchema, // inverse for closing gw
            branches: isOpening(element) ? extractBranchConditions(element.branches, element) : false
        };
    }
 }