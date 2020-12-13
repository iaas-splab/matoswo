import _ from 'lodash';
import {
    CONDITIONAL_BLOCK,
    DEFAULT_BRANCH,
    FANOUT_BLOCK,
    LOOP_BLOCK,
    PARALLEL_BLOCK,
    SUB_WORKFLOW_BLOCK,
    TASK
} from '../../../util/Constants';
import {BaseConditionTraverser} from '../../condition/BaseConditionTraverser';
import {BaseControlFlowHierarchyTraverser} from '../BaseControlFlowHierarchyTraverser';

/**
 * A validator that validates a control flow hierarchy.
 * This validator ensures that a control flow hierarchy is valid for all of the three orchestrators: Step Functions, Durable Functions, Composer.
 * Other, more specific validators could be written in a similar manner to this one and invoked instead or in addition.
 * Overwrite the specific traversal methods inherited from the BaseControlFlowHierarchyTraverser.
 */
export class StrictModelValidator extends BaseControlFlowHierarchyTraverser {

    validate(controlFlowHierarchy) {
        this.dispatch(controlFlowHierarchy);
    }

    traverseSequenceBlock(sequenceBlock, param2, containingBlock) {
        let seq = sequenceBlock.getSequence();

        for (let i = 0; i < seq.length; i++) {
            if (i > 0) {
                this.compareSchema(  // compare previous out schema with next in schema
                    seq[i - 1].getOutputSchema(),
                    seq[i].getInputSchema(),
                    seq[i - 1].id,
                    seq[i].id
                );
            } else {
                this.compareSchema(containingBlock, seq[0].getInputSchema(), 'Containing Block', seq[0].id);
            }
        }

        for (let element of seq) {
            this.dispatch(element, param2);
        }
    }

    traverseTask(task, isInParallel) {
        const errorHandler = task.getErrorHandler();

        if (errorHandler) {
            if (isInParallel) {
                throw 'The activity with id: ' + task.getId() + ' can can not handle errors in parallel blocks, due to inconsistent behavior among orchestrators';
            } else {
                this.dispatch(errorHandler);
            }
        }
    }

    traverseSubWorkflowBlock(subworkflowBlock, isInParallel) {
        if (subworkflowBlock.getSequenceBlock()) {
            this.dispatch(subworkflowBlock.getSequenceBlock());
        }

        this.traverseTask(subworkflowBlock, isInParallel); // task checks are the same as subworkflow block
    }

    traverseFanoutBlock(fanoutBlock) {
        let seq = fanoutBlock.getSequenceBlock().getSequence();

        if (seq.length !== 1) {
            throw 'Fanout block with id: ' + fanoutBlock.getId() + ' must have length 1';
        } else {
            if (seq[0].getType() === TASK || seq[0].getType() === SUB_WORKFLOW_BLOCK) {
                if (!this.hasSchemaValueArray(fanoutBlock.getInputSchema()) || !this.hasSchemaValueArray(seq[0].getInputSchema())) {
                    throw FANOUT_BLOCK + ' with id: ' + fanoutBlock.getId() + ' does not have value array input'; // Composer must have { value: [] } input for map combinator
                }

                this.dispatch(seq[0], true); // inform the task or sub workflow that it is in parallel 
            } else {
                throw 'Invalid type for id: ' + seq[0].getId() + ', must be ' + TASK + ' or ' + SUB_WORKFLOW_BLOCK;
            }
        }
        if (!this.hasSchemaValueArray(fanoutBlock.getOutputSchema(), true)) {
            throw FANOUT_BLOCK + ' with id: ' + fanoutBlock.getId() + ' does not have only a value array output'; // Composer must have { value: [] } output of parallel combinators
        }
    }

    traverseParallelBlock(parallelBlock) {
        const branches = parallelBlock.getBranchSequenceBlocks();

        if (branches.length < 2) {
            throw PARALLEL_BLOCK + ' with id: ' + parallelBlock.getId() + ' must have at least two parallel branches';
        }

        for (let branchSeqBlock of branches) {
            const branch = branchSeqBlock.getSequence();

            if (branch.length === 1) {
                if (branch[0].getType() === TASK || branch[0].getType() === SUB_WORKFLOW_BLOCK) {
                    this.dispatch(branch[0], true, parallelBlock.getInputSchema()); // inform the task or sub workflow that it is in parallel
                } else {
                    throw PARALLEL_BLOCK + ' with id: ' + parallelBlock.getId() + 'can only parallelize a ' + TASK + ' or a ' + SUB_WORKFLOW_BLOCK;
                }
            } else {
                throw PARALLEL_BLOCK + ' with id: ' + parallelBlock.getId() + ' branch length must be 1';
            }
        }

        if (!this.hasSchemaValueArray(parallelBlock.getOutputSchema(), true)) {
            throw PARALLEL_BLOCK + ' with id: ' + parallelBlock.getId() + ' does not have only a value array output'; // Composer must have { value: [] } output of parallel combinators
        }
    }

    traverseLoopBlock(loopBlock) {
        let seq = loopBlock.getSequenceBlock().getSequence();
        const baseConditionTraverser = new BaseConditionTraverser();
        baseConditionTraverser.traverseCondition(loopBlock.getLoopCondition(), loopBlock);
        const visitedVars = baseConditionTraverser.getVisitedVariables();

        for (let visitedVar of visitedVars) {
            if (!this.isVariablePresentInSchema(loopBlock.getInputSchema(), visitedVar)) {
                throw LOOP_BLOCK + ' with id: ' + loopBlock.getId() + ' used conditional variable' + visitedVar + ' not defined in its input schema';
            }
        }

        if (seq.length !== 1) {
            throw LOOP_BLOCK + ' with id: ' + loopBlock.getId() + ' must have length 1';
        } else {
            if (seq[0].getType() !== TASK && seq[0].getType() !== SUB_WORKFLOW_BLOCK) {
                throw 'Invalid type for id: ' + seq[0].getId() + ', must be ' + TASK + ' or ' + SUB_WORKFLOW_BLOCK;
            } else {
                this.dispatch(seq[0], false);
            }
        }
    }

    traverseConditionalBlock(conditionalBlock) {
        const branches = conditionalBlock.getBranchSequenceBlocks();

        for (let branchName in branches) {
            if (branchName !== DEFAULT_BRANCH) {
                const baseConditionTraverser = new BaseConditionTraverser();
                baseConditionTraverser.traverseCondition(conditionalBlock.getBranchConditions()[branchName], conditionalBlock);
                const visitedVars = baseConditionTraverser.getVisitedVariables();

                for (let visitedVar of visitedVars) {
                    if (!this.isVariablePresentInSchema(conditionalBlock.getInputSchema(), visitedVar)) {
                        throw CONDITIONAL_BLOCK + ' with id: ' + conditionalBlock.getId() + ' used conditional variable' + visitedVar + ' not defined in its input schema';
                    }
                }
            }
            this.dispatch(branches[branchName], false, conditionalBlock.getInputSchema());
        }
    }

    compareSchema(prev, next, prevId, nextId) {
        if (!prev || !next || !prev.trim() || !next.trim()) {
            return true;
        }

        let inSchemaObj = false;
        let outSchemaObj = false;

        try {
            inSchemaObj = JSON.parse(prev);
            outSchemaObj = JSON.parse(next);
        } catch (err) {
            throw 'Error when parsing and comparing schema between elements with id: ' + prevId + ' and id: ' + nextId + err.message;
        }

        if (_.isEqual(inSchemaObj, outSchemaObj)) {
            return true;
        } else {
            throw 'Schemas do not match at elements with id: ' + prevId + ' and id: ' + nextId + ' with inputs: ' + prev + ' and ' + next;
        }
    }

    hasSchemaValueArray(schema, exclusive = false) {
        if (!schema) {
            return true;
        }

        try {
            const schemaObj = JSON.parse(schema);

            if (schemaObj.type && schemaObj.type === 'object') {
                if (schemaObj.properties && schemaObj.properties.value) {
                    if (schemaObj.properties.value.type && schemaObj.properties.value.type === 'array') {
                        if (exclusive) {
                            return Object.keys(schemaObj.properties).length === 1;
                        }

                        return true;
                    }
                }
            }

            return false;
        } catch (err) {
            console.log(err.message);
            return false;
        }
    }

    isVariablePresentInSchema(schema, variable) {
        if (!schema) {
            return true;
        }

        try {
            let schemaObj = JSON.parse(schema);
            const varPaths = variable.split('.'); // the components of the variable in the input json

            for (let i = 0; i < varPaths.length; i++) {
                if (schemaObj.type && schemaObj.type === 'object') {
                    if (schemaObj.properties && schemaObj.properties[varPaths[i]]) {
                        schemaObj = schemaObj.properties[varPaths[i]];
                    } else {
                        return false;
                    }
                } else {
                    return false
                }
            }

            return true;
        } catch (err) {
            console.log(err.message);
            return false;
        }
    }
}