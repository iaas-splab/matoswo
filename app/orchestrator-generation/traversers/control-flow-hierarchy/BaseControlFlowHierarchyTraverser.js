import {
    CONDITIONAL_BLOCK,
    DELAY_TIMER,
    FANOUT_BLOCK,
    LOOP_BLOCK,
    PARALLEL_BLOCK,
    SEQUENCE_BLOCK,
    SUB_WORKFLOW_BLOCK,
    TASK
} from "../../util/Constants";

/**
 * Provide the ability to traverse a control flow hierarchy by constituent elements.
 */
export class BaseControlFlowHierarchyTraverser {

    /**
     * Depending on the ControlFlowElement's type, traverse that element with the appropriate method.
     * Intended to be called for each element, when traversing a containing element.
     */
    dispatch(element, param2, param3) {
        if (element.getType() === SEQUENCE_BLOCK) {
            return this.traverseSequenceBlock(element, param2, param3);
        } else if (element.getType() === TASK) {
            return this.traverseTask(element, param2, param3);
        } else if (element.getType() === SUB_WORKFLOW_BLOCK) {
            return this.traverseSubWorkflowBlock(element, param2, param3);
        } else if (element.getType() === DELAY_TIMER) {
            return this.traverseDelayTimer(element, param2, param3);
        } else if (element.getType() === FANOUT_BLOCK) {
            return this.traverseFanoutBlock(element, param2, param3);
        } else if (element.getType() === PARALLEL_BLOCK) {
            return this.traverseParallelBlock(element, param2, param3);
        } else if (element.getType() === LOOP_BLOCK) {
            return this.traverseLoopBlock(element, param2, param3);
        } else if (element.getType() === CONDITIONAL_BLOCK) {
            return this.traverseConditionalBlock(element, param2, param3);
        } else {
            throw 'Unsupported type for element id: ' + element.getId();
        }
    }
    //////////////////////////////////////////////////////////////
    // specific traversal methods for each element type.        //
    // to be overwritten by sub-classes of this base traverser. //
    //////////////////////////////////////////////////////////////

    traverseSequenceBlock(sequenceBlock, param2, param3) {

    }

    traverseTask(task, param2, param3) {

    }

    traverseSubWorkflowBlock(subWorkflowBlock, param2, param3) {

    }

    traverseDelayTimer(delayTimer, param2, param3) {
        
    }

    traverseFanoutBlock(fanoutBlock, param2, param3) {

    }

    traverseParallelBlock(parallelBlock, param2, param3) {

    }

    traverseLoopBlock(loopBlock, param2, param3) {

    }

    traverseConditionalBlock(conditionalBlock, param2, param3) {

    }
}