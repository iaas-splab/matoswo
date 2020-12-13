import {BPMN_PROCESS} from "../util/Constants";
import {StartEventExtractor} from "./StartEventExtractor";
import {IntermediateEventExtract} from "./IntermediateEventExtract";
import {BoundaryEventExtractor} from "./BoundaryEventExtractor";
import {EndEventExtractor} from "./EndEventExtractor";
import {SequenceFlowExtractor} from "./SequenceFlowExtractor";
import {SubProcessExtractor} from "./SubProcessExtractor";
import {TaskExtractor} from "./TaskExtractor";
import {ParallelGatewayExtractor} from "./ParallelGatewayExtractor";
import {ExclusiveGatewayExtractor} from "./ExclusiveGatewayExtractor";

export class ProcessExtractor {

    constructor(additionalSupportedElements=[]) {
        this.supportedElements = [
            new StartEventExtractor(),
            new IntermediateEventExtract(),
            new BoundaryEventExtractor(),
            new EndEventExtractor(),
            new SequenceFlowExtractor(),
            new SubProcessExtractor(),
            new TaskExtractor(),
            new ExclusiveGatewayExtractor(),
            new ParallelGatewayExtractor()
        ];

        for (let supportedElement of additionalSupportedElements) {
            this.supportedElements.push(supportedElement);
        }
    }

    getType() {
        return BPMN_PROCESS;
    }

    /**
     * Extract a simplified representation of an entire bpmn process,
     * making use of the specific extractors for the supported elements.
     */
    extractSimplified(process) {
        const elements = {};

        for (let element of process.flowElements) {
            let elementTypeFound = false;

            for (let supportedElement of this.supportedElements) {
                if (element.$type === supportedElement.getType()) {
                    elements[element.id] = supportedElement.extractSimplified(element, this.supportedElements);
                    elementTypeFound = true;
                }
            }

            if (!elementTypeFound) {
                throw 'The element with id: ' + element.id + ' has unsupported type: ' + element.$type;
            }
        }

        let startEventCount = 0;
        let startEvent = false;
        let endEvent = false;

        for (let id of Object.keys(elements)) {
            if (elements[id].$type === this.supportedElements[0].getType()) {
                startEventCount++;
                startEvent = elements[id];
            } else if (elements[id].$type === this.supportedElements[3].getType()) {
                endEvent = elements[id];
            }
        }

        if (!endEvent) {
            throw 'The ' + this.getType() + ' with id: ' + process.id + ' with no definition must have an end event';
        }

        if (startEventCount !== 1 || Object.keys(elements).length < 5) { // a workflow that does at least one thing (2 sq flows, 1 start, 1 end, ...other elements)
            return false;
        }

        return {
            startEvent: startEvent,
            elements: elements,
        };
    }
}