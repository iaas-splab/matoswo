import {
    BPMN_BEE,
    BPMN_END_EVENT,
    BPMN_EXCL_GW,
    BPMN_IET,
    BPMN_PARA_GW,
    BPMN_SEQUENCE_FLOW,
    BPMN_SUB_PROCESS,
    BPMN_TASK,
    DEFAULT_BRANCH
} from '../util/Constants';
import {
    validateActivityDoesNotLoopToSelf,
    isClosing,
    isOpening,
    validateAllElementsAreSame,
    validateBranchName,
    validateNoDuplicateNames
} from '../util/util';
import {SequenceBlock} from '../model/SequenceBlock';
import {SubWorkflowBlock} from '../model/SubWorkflowBlock';
import {Task} from '../model/Task';
import {ConditionalBlock} from '../model/ConditionalBlock';
import {ParallelBlock} from '../model/ParallelBlock';
import {FanoutBlock} from '../model/FanoutBlock';
import {LoopBlock} from '../model/LoopBlock';
import {DelayTimer} from '../model/DelayTimer';

/**
 * Build a hierarchy of ControlFlowElements representing a serverless workflow.
 */
export class ControlFlowHierarchyBuilder {

    constructor() {
        this.gatewayStack = []; // keep track of open/closed gateways in a bracketed manner
        this.builtModelElements = []; // keep track of all ControlFlowElements
        this.openingGwOutSchemas = {}; // keep track of schemas across gateways
    }

    /**
     * Build a hierarchy of control flow elements representing a serverless workflow.
     * From this hierarchy, the various orchestrators can be generated.
     *
     * Input is a simplified process (from extractors/ProcessExtractor) representing a serverless workflow.
     */
    buildControlFlowHierarchy(sp) {
        const firstElement = sp.elements[sp.elements[sp.startEvent.outgoing].outgoing];
        const sequenceBlock = this.buildSequence(firstElement, sp);

        if (this.gatewayStack.length !== 0) {
            throw 'Error building control flow hierarchy: the gateways do not match up';
        }

        this.handleBoundaryEventErrors(sp);

        if (this.gatewayStack.length !== 0) {
            throw 'Error building control flow hierarchy: the gateways do not match up';
        }

        return sequenceBlock.sequence;
    }

    /**
     * Build a SequenceBlock control flow element, which contains further control flow elements in a sequence.
     * Starts at a beginning element and continuously iterates all subsequent elements, from a simplified process.
     * For each element, build it's representing control flow element, with it's own builder method.
     */
    buildSequence(firstElem, process, expectExactlyOneOutgoing = true) {
        const sequence = [];
        let currElem = firstElem;
        let firstElemAfterClosingGW = false;

        while (currElem) {
            switch (currElem.$type) {
                case BPMN_TASK: // handle both bpmn activity cases
                case BPMN_SUB_PROCESS:
                    const activity = (currElem.$type === BPMN_TASK) ? this.buildTask(currElem, process) : this.buildSubProcess(currElem, process);
                    const activityBlock = activity.activity;
                    this.builtModelElements.push(activityBlock);
                    validateActivityDoesNotLoopToSelf(currElem, process);

                    if (currElem.isFanout) {
                        sequence.push(this.buildFanoutBlock(activityBlock));
                    } else if (currElem.isLoop) {
                        sequence.push(this.buildLoopBlock(activityBlock, currElem.loopCondition));
                    } else {
                        sequence.push(activityBlock);
                    }

                    if (expectExactlyOneOutgoing) { // if regular program flow, exactly one outgoing is expected
                        if (!currElem.outgoing) {
                            throw 'The element with id: ' + currElem.id + ' must have one outgoing ' + BPMN_SEQUENCE_FLOW;
                        }
                    } else { // if there is an outgoing element (and none necessary, as in case of the current sequence being error control flow)
                        // --> do not continue with main flow after the error sequence terminates
                        activityBlock.setContinueAfterError(!currElem.outgoing);
                    }

                    currElem = activity.nextElement;
                    break;
                case BPMN_IET: // wait/delay in a workflow
                    const delayTimer = new DelayTimer(currElem.id, currElem.name, currElem.inputSchema, currElem.outputSchema, currElem.milliseconds);
                    sequence.push(delayTimer);
                    this.builtModelElements.push(delayTimer);
                    currElem = process.elements[process.elements[currElem.outgoing].outgoing];
                    break;
                case BPMN_EXCL_GW: // handle both bpmn gateway cases
                case BPMN_PARA_GW:
                    if (isOpening(currElem)) { // save to stack the opening gateway along with remaining required incoming
                        this.gatewayStack.push({source: currElem, targetCountClosingGw: currElem.outgoing.length});
                        const gateway = (currElem.$type === BPMN_EXCL_GW) ? this.buildExclusiveGateway(currElem, process) : this.buildParallelGateway(currElem, process);
                        const gwBlock = gateway.gateway;
                        gwBlock.outputSchema = this.openingGwOutSchemas[gwBlock.getId()];
                        this.builtModelElements.push(gwBlock);
                        sequence.push(gwBlock);
                        currElem = gateway.nextElement;
                    } else if (isClosing(currElem)) {
                        const closingCandidate = this.gatewayStack[this.gatewayStack.length - 1];

                        // remove gateway from stack if it is the last one matching the current one (i.e. 'close the bracket')
                        if (closingCandidate.source.$type === currElem.$type && closingCandidate.source.outgoing.length === currElem.incoming.length) {
                            closingCandidate.targetCountClosingGw = closingCandidate.targetCountClosingGw - 1;

                            if (closingCandidate.targetCountClosingGw === 0) {
                                const openingGwId = this.gatewayStack.pop().source.id;
                                this.openingGwOutSchemas[openingGwId] = currElem.outputSchema;
                            }

                            firstElemAfterClosingGW = process.elements[process.elements[currElem.outgoing[0]].outgoing];
                            currElem = false;
                        } else {
                            throw 'The gateway with id: ' + currElem.id + ' is not a matching closing gateway';
                        }
                    } else {
                        throw 'The gateway with id: ' + currElem.id + ' is neither opening nor closing';
                    }
                    break;
                case BPMN_END_EVENT:
                    if (this.builtModelElements.length > 1) {
                        this.builtModelElements[this.builtModelElements.length - 1].terminatesWithError = currElem.isErrorEndEvent;
                    }

                    currElem = false;
                    break;
                default:
                    throw 'Encountered unsupported type: ' + currElem.$type + ' when building sequence, handling element with id: ' + currElem.id;
            }
        }
        return {
            sequence: new SequenceBlock(null, null, null, null, sequence),
            nextElement: firstElemAfterClosingGW
        };
    }

    buildTask(taskElement, process) {
        return {
            activity: new Task(
                taskElement.id,
                taskElement.name,
                taskElement.inputSchema,
                taskElement.outputSchema,
                taskElement.retryCount,
                taskElement.timeoutMilliseconds
            ),
            nextElement: (!taskElement.outgoing) ? false : process.elements[process.elements[taskElement.outgoing].outgoing]
        };
    }

    buildSubProcess(subProcessElement, process) {
        const sp = subProcessElement.content;
        let sequenceBlock = false;

        if (sp) { // the sub-process has a definition, and therefore a control flow hierarchy for it must be built (as it's own sub-orchestrator)
            sequenceBlock = new ControlFlowHierarchyBuilder().buildControlFlowHierarchy(sp);
        }

        return {
            activity: new SubWorkflowBlock(
                subProcessElement.id,
                subProcessElement.name,
                subProcessElement.inputSchema,
                subProcessElement.outputSchema,
                subProcessElement.retryCount,
                subProcessElement.timeoutMilliseconds,
                sequenceBlock
            ),
            nextElement: (!subProcessElement.outgoing) ? false : process.elements[process.elements[subProcessElement.outgoing].outgoing]
        };
    }

    buildFanoutBlock(fanoutElement) {
        return new FanoutBlock(
            'Fanout' + fanoutElement.id,
            fanoutElement.name,
            fanoutElement.inputSchema,
            fanoutElement.outputSchema,
            new SequenceBlock(null, null, null, null, [fanoutElement])
        );
    }

    buildLoopBlock(loopElement, loopCondition) {
        return new LoopBlock(
            'Loop' + loopElement.id,
            loopElement.name,
            loopElement.inputSchema,
            loopElement.outputSchema,
            loopCondition,
            new SequenceBlock(null, null, null, null, [loopElement])
        );
    }

    buildExclusiveGateway(exclusiveGwElement, process) {
        const branchConditions = exclusiveGwElement.branches; // actual boolean condition per branch name
        const branchSequences = {}; // store separate sequences for each branch name
        const branchNames = []; // the names for every branch
        const nextElements = []; // the elements subsequent to a branch's last element (used for validation only)

        for (let outFlow of exclusiveGwElement.outgoing) { // iterate every outgoing branch from the opening gateway
            let outFlowElem = process.elements[outFlow];
            const firstBranchElement = process.elements[outFlowElem.outgoing];
            const branchSequence = this.buildSequence(firstBranchElement, process);

            validateBranchName(outFlowElem);
            branchNames.push(outFlowElem.name);
            nextElements.push(branchSequence.nextElement);
            branchSequences[outFlowElem.name] = branchSequence.sequence; // { branchName: actualBranchSequence, .. }
        }

        if (branchNames.length < 2) {
            throw 'The ' + BPMN_EXCL_GW + ' with id: ' + exclusiveGwElement.id + ' must have at least two branches';
        }

        if (!branchNames.includes(DEFAULT_BRANCH)) {
            throw 'No default branch found for ' + BPMN_EXCL_GW + ' with id: ' + exclusiveGwElement.id;
        }

        validateAllElementsAreSame(nextElements); // ensure all nextStates after each branch points to the same target
        validateNoDuplicateNames(branchNames); // ensure no branch is declared twice

        if (Object.keys(branchConditions).length === Object.keys(branchSequences).length - 1) { // -1 since there is no default condition
            for (let branchName in branchConditions) { // ensure branchNames from conditions and sequences match up
                if (!branchSequences[branchName]) {
                    throw 'Branch name: ' + branchName + ' of condition map does not have a sequence for ' + BPMN_EXCL_GW + ' with id: ' + exclusiveGwElement.id;
                }
            }
        } else {
            throw 'Number of branch conditions and sequences do not match up for ' + BPMN_EXCL_GW + ' with id' + exclusiveGwElement.id;
        }

        return {
            gateway: new ConditionalBlock(
                exclusiveGwElement.id,
                exclusiveGwElement.name,
                exclusiveGwElement.inputSchema,
                exclusiveGwElement.outputSchema,
                branchSequences, // { branchName: branchSequence, .. }
                branchConditions // { branchName: branchCondition, .. }
            ),
            nextElement: nextElements[0]
        };
    }

    buildParallelGateway(parallelGwElement, process) {
        const branchSequences = [];
        const nextElements = [];

        for (let outFlow of parallelGwElement.outgoing) { // iterate every outgoing branch from the opening gateway
            const firstBranchElement = process.elements[process.elements[outFlow].outgoing];
            const branchSequence = this.buildSequence(firstBranchElement, process);

            branchSequences.push(branchSequence.sequence);
            nextElements.push(branchSequence.nextElement);
        }

        validateAllElementsAreSame(nextElements);

        return {
            gateway: new ParallelBlock(
                parallelGwElement.id,
                parallelGwElement.name,
                parallelGwElement.inputSchema,
                parallelGwElement.outputSchema,
                branchSequences
            ),
            nextElement: nextElements[0]
        }
    }

    handleBoundaryEventErrors(process) {
        for (let elementId of Object.keys(process.elements)) {
            const element = process.elements[elementId];

            if (element.$type === BPMN_BEE) {
                this.setErrorHandlers(element, process);
            }
        }
    }

    setErrorHandlers(errorEvent, process) {
        for (let visitedActivity of this.builtModelElements) {
            if (errorEvent.incoming === visitedActivity.getId()) {
                // for the current error event, the originating error-triggering control flow element was found

                const firstElementInErrorSequence = process.elements[process.elements[errorEvent.outgoing.id].outgoing];
                const errorSequenceBlock = this.buildSequence(firstElementInErrorSequence, process, false).sequence;
                visitedActivity.setErrorHandler(errorSequenceBlock);
                const errorSequence = errorSequenceBlock.getSequence();
                const lastElementInErrorSequence = errorSequence[errorSequence.length - 1];

                if (lastElementInErrorSequence && lastElementInErrorSequence.getContinueAfterError()) {
                    let subsequentElem = process.elements[process.elements[process.elements[visitedActivity.getId()].outgoing].outgoing];

                    while (true) {
                        if ((subsequentElem.$type === BPMN_EXCL_GW || subsequentElem.$type === BPMN_PARA_GW) && subsequentElem.incoming.length > 1) {
                            // closing gateway -> skip
                            subsequentElem = process.elements[process.elements[process.elements[subsequentElem.id].outgoing].outgoing];
                        } else {
                            break;
                        }
                    }

                    const subsequentElems = this.builtModelElements.filter(e => e.getId() === subsequentElem.id);
                    if (subsequentElems.length === 1) {
                        lastElementInErrorSequence.setContinueAfterError(subsequentElems[0]);
                    } else {
                        lastElementInErrorSequence.setContinueAfterError(false);
                    }
                }
            }
        }
    }
}