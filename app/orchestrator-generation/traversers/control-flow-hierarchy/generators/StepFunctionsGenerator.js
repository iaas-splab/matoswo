import {DEFAULT_BRANCH, DEFAULT_DURABLE_FUNCTIONS_TIMEOUT, DEFAULT_RETRY_COUNT} from '../../../util/Constants';
import {StepFunctionsConditionGenerator} from '../../condition/generators/StepFunctionsConditionGenerator';
import {BaseOrchestratorGenerator} from './BaseOrchestratorGenerator';

/**
 * Traverse a control flow hierarchy and generate a Step Functions orchestrator from the modeled workflow.
 */
export class StepFunctionsGenerator extends BaseOrchestratorGenerator {

    constructor(awsAccountId = "ACCOUNT_ID_HERE", awsAccountRegion = "ACCOUNT_REGION_HERE") {
        super();
        this.awsAccountId = awsAccountId;
        this.awsAccountRegion = awsAccountRegion;
        this.isFirstState = true;
    }

    generateOrchestrator(name, sequenceBlock, indent = '') {
        let generated = '{';
        generated += '\n' + indent + this.indent(1) + '"StartAt": "' + this.getStateName(sequenceBlock.getFirstElement()) + '",';
        generated += '\n' + indent + this.indent(1) + '"States": {';
        generated += this.traverseSequenceBlock(sequenceBlock, indent + this.indent(2), false);
        generated += '\n' + indent + this.indent(1) + '}';
        generated += '\n' + indent + '}';

        if (name) { // an orchestrator with a name set will be placed into it's own file
            this.getOutputFiles().push({name: name + '.asl', content: generated});
        } else { // no name -- inner state machine; return as string
            return generated;
        }
    }

    traverseSequenceBlock(sequenceBlock, indentation, nextState) {
        const sequence = sequenceBlock.getSequence();
        let generated = '';
        let nextElement = false;

        for (let i = 0; i < sequence.length; i++) {
            if (i < sequence.length - 1) {
                nextElement = sequence[i + 1];
            } else {
                nextElement = nextState;
            }

            generated += this.dispatch(sequence[i], indentation, nextElement);
        }

        return generated;
    }

    traverseTask(task, indentation, nextState) {
        let generated = this.generateStateHeader(task, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Task",'
        generated += '\n' + indentation + this.indent(1) + '"Resource": "arn:aws:lambda:' + this.awsAccountRegion + ':' + this.awsAccountId + ':function:' + task.getName() + '",';
        generated += this.generateTimeoutRetry(task, indentation);
        generated += this.generateStateFooter(nextState, indentation, task);
        generated += this.generateErrorHandler(task, indentation);
        return generated;
    }

    traverseSubWorkflowBlock(subWorkflowBlock, indentation, nextState) {
        if (subWorkflowBlock.getSequenceBlock()) {
            const sfGen = new StepFunctionsGenerator(this.awsAccountId, this.awsAccountRegion);
            sfGen.generateOrchestrator(subWorkflowBlock.getName(), subWorkflowBlock.getSequenceBlock());
            this.getOutputFiles().push.apply(this.getOutputFiles(), sfGen.getOutputFiles());
        }

        let generated = this.generateStateHeader(subWorkflowBlock, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Task",';
        generated += '\n' + indentation + this.indent(1) + '"Resource": "arn:aws:states:::states:startExecution.sync:2",';
        generated += '\n' + indentation + this.indent(1) + '"Parameters": {';
        generated += '\n' + indentation + this.indent(2) + '"StateMachineArn": "arn:aws:states:' + this.awsAccountRegion + ':' + this.awsAccountId + ':stateMachine:' + subWorkflowBlock.getName() + '",';
        generated += '\n' + indentation + this.indent(2) + '"Input": {';
        generated += '\n' + indentation + this.indent(3) + '"NeedCallback": false,';
        generated += '\n' + indentation + this.indent(3) + '"AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID.$": "$$.Execution.Id",';
        generated += '\n' + indentation + this.indent(3) + '"value.$": "$.value"';
        generated += '\n' + indentation + this.indent(2) + '}';
        generated += '\n' + indentation + this.indent(1) + '},';
        generated += '\n' + indentation + this.indent(1) + '"OutputPath": "$.Output",'; // state machine output from service integration
        generated += this.generateTimeoutRetry(subWorkflowBlock, indentation);
        generated += this.generateStateFooter(nextState, indentation, subWorkflowBlock);
        generated += this.generateErrorHandler(subWorkflowBlock, indentation);
        return generated;
    }

    traverseDelayTimer(delayTimer, indentation, nextState) {
        let generated = this.generateStateHeader(delayTimer, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Wait",'
        generated += '\n' + indentation + this.indent(1) + '"Seconds": ' + Math.ceil(delayTimer.getMilliseconds() / 1000) + ',';
        generated += this.generateStateFooter(nextState, indentation, delayTimer);
        return generated;
    }

    traverseFanoutBlock(fanoutBlock, indentation, nextState) {
        let generated = this.generateStateHeader(fanoutBlock, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Map",'
        generated += '\n' + indentation + this.indent(1) + '"ItemsPath": "$.value",'; // the collection variable / item input list for the map and parallel states; the same as enforced by openwhisk
        generated += '\n' + indentation + this.indent(1) + '"ResultPath": "$.value",';
        generated += '\n' + indentation + this.indent(1) + '"Iterator": ';

        const sfGen = new StepFunctionsGenerator(this.awsAccountId, this.awsAccountRegion);
        generated += sfGen.generateOrchestrator(false, fanoutBlock.getSequenceBlock(), indentation + this.indent(1)) + ',';
        this.getOutputFiles().push.apply(this.getOutputFiles(), sfGen.getOutputFiles());
        generated += this.generateStateFooter(nextState, indentation, fanoutBlock);
        return generated;
    }

    traverseParallelBlock(parallelBlock, indentation, nextState) {
        const paraBlocks = parallelBlock.getBranchSequenceBlocks();
        let generated = this.generateStateHeader(parallelBlock, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Parallel",';
        generated += '\n' + indentation + this.indent(1) + '"ResultPath": "$.value",';
        generated += '\n' + indentation + this.indent(1) + '"Branches": [';

        for (let i = 0; i < paraBlocks.length; i++) {
            const sfGen = new StepFunctionsGenerator(this.awsAccountId, this.awsAccountRegion);
            generated += '\n' + indentation + this.indent(2) + sfGen.generateOrchestrator(false, paraBlocks[i], indentation + this.indent(2)) + (i < paraBlocks.length - 1 ? ',' : '');
            this.getOutputFiles().push.apply(this.getOutputFiles(), sfGen.getOutputFiles());
        }

        generated += '\n' + indentation + this.indent(1) + '],';
        generated += this.generateStateFooter(nextState, indentation, parallelBlock);
        return generated;
    }

    traverseLoopBlock(loopBlock, indentation, nextState) {
        const ccg = new StepFunctionsConditionGenerator(indentation + this.indent(2));
        ccg.traverseCondition(loopBlock.getLoopCondition(), loopBlock);

        let generated = this.generateStateHeader(loopBlock, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Choice",'
        generated += '\n' + indentation + this.indent(1) + '"Choices": [';
        generated += '\n' + indentation + this.indent(2) + '{';
        generated += ccg.getGenerated();
        generated += ',\n' + indentation + this.indent(3) + '"Next": "' + this.getStateName(loopBlock.getSequenceBlock().getFirstElement()) + '"';
        generated += '\n' + indentation + this.indent(2) + '}';
        generated += '\n' + indentation + this.indent(1) + '],';
        generated += '\n' + indentation + this.indent(1) + '"Default": "';

        if (nextState) {
            generated += this.getStateName(nextState) + '"\n' + indentation + '}';
        } else { // exit condition -> next state after loop; also end state if loop has no successor
            generated += 'End' + this.getStateName(loopBlock) + '"\n' + indentation + '}';
            generated += ',\n' + indentation + '"' + 'End' + this.getStateName(loopBlock) + '": {\n' + indentation + this.indent(2) + '"Type": "Succeed"\n' + indentation + '}';
        }

        generated += this.traverseSequenceBlock(loopBlock.getSequenceBlock(), indentation, loopBlock); // return to this choice state after inner loop sequence
        return generated;
    }

    traverseConditionalBlock(conditionalBlock, indentation, nextState) {
        const branchSeqs = conditionalBlock.getBranchSequenceBlocks();
        const branchConds = conditionalBlock.getBranchConditions();
        const branchNames = Object.keys(branchSeqs).filter(name => name !== DEFAULT_BRANCH);
        const generatedEndStateName = 'End' + this.getStateName(conditionalBlock);
        let generatedEndStateRequired = false;

        let generated = this.generateStateHeader(conditionalBlock, indentation);
        generated += '\n' + indentation + this.indent(1) + '"Type": "Choice",'
        generated += '\n' + indentation + this.indent(1) + '"Choices": [';

        // handle all branches with conditions

        for (let i = 0; i < branchNames.length; i++) {
            const ccg = new StepFunctionsConditionGenerator(indentation + this.indent(2));
            ccg.traverseCondition(branchConds[branchNames[i]], conditionalBlock);
            const condition = ccg.getGenerated();

            generated += '\n' + indentation + this.indent(2) + '{';
            generated += condition;

            const firstBranchElement = branchSeqs[branchNames[i]].getFirstElement();

            if (firstBranchElement) {
                generated += ',\n' + indentation + this.indent(3) + '"Next": "' + this.getStateName(firstBranchElement) + '"';
            } else {
                if (nextState) {
                    generated += ',\n' + indentation + this.indent(3) + '"Next": "' + this.getStateName(nextState) + '"';
                } else {
                    generated += ',\n' + indentation + this.indent(3) + '"Next": "' + generatedEndStateName + '"';
                    generatedEndStateRequired = true;
                }
            }

            generated += '\n' + indentation + this.indent(2) + '}' + (i < branchNames.length - 1 ? ',' : '');
        }

        generated += '\n' + indentation + this.indent(1) + '],';

        // all condition branches handled, now handle the default branch

        let firstBranchElement = branchSeqs[DEFAULT_BRANCH].getFirstElement();

        if (firstBranchElement) {
            generated += '\n' + indentation + this.indent(1) + '"Default": "' + this.getStateName(firstBranchElement) + '"';
        } else {
            if (nextState) {
                generated += '\n' + indentation + this.indent(1) + '"Default": "' + this.getStateName(nextState) + '"';
            } else {
                generated += '\n' + indentation + this.indent(1) + '"Default": "' + generatedEndStateName + '"';
                generatedEndStateRequired = true;
            }
        }

        generated += '\n' + indentation + '}';

        if (generatedEndStateRequired) {
            generated += ',\n' + indentation + '"' + generatedEndStateName + '": {\n' + indentation + this.indent(1) + '"Type": "Succeed"\n' + indentation + '}';
        }

        branchNames.push(DEFAULT_BRANCH); // add back the default branch, no special treatment necessary for sequence block generation

        for (let i = 0; i < branchNames.length; i++) {
            generated += this.traverseSequenceBlock(
                branchSeqs[branchNames[i]],
                indentation,
                (nextState ? nextState : (generatedEndStateRequired ? generatedEndStateName : false))
            );
        }
        return generated;
    }

    getStateName(element) {
        if (typeof element === 'string') {
            return element;
        }

        return element.getName() + element.getId();
    }

    generateStateHeader(state, indentation) {
        let generated = '';

        if (!this.isFirstState) {
            generated += ',';
        }

        this.isFirstState = false;
        generated += '\n' + indentation + '"' + this.getStateName(state) + '": {';
        return generated;
    }

    generateStateFooter(nextState, indentation, activity) {
        let generated = '\n' + indentation + this.indent(1);

        if (nextState) {
            generated += '"Next": "' + this.getStateName(nextState) + '"\n' + indentation + '}';
        } else {
            if (activity.terminatesWithError) {
                generated += '"Next": "Error' + this.getStateName(activity) + '"\n' + indentation + '}';
                generated += ',\n' + indentation + '"Error' + this.getStateName(activity) + '": {\n' + indentation + this.indent(1) + '"Type": "Fail"\n' + indentation + '}';
            } else {
                generated += '"End": true\n' + indentation + '}';
            }
        }

        return generated;
    }

    generateTimeoutRetry(element, indentation) {
        let generated = '\n' + indentation + this.indent(1) + '"TimeoutSeconds": '; // there is no default timeout in step functions, so always set one

        if (element.getTimeoutMilliseconds()) {
            generated += Math.ceil(element.getTimeoutMilliseconds() / 1000) + ', ';
        } else {
            generated += DEFAULT_DURABLE_FUNCTIONS_TIMEOUT + ', ';
        }

        if (element.getRetryCount() && element.getRetryCount() !== DEFAULT_RETRY_COUNT) {
            generated += '\n' + indentation + this.indent(1) + '"Retry": [';
            generated += '\n' + indentation + this.indent(2) + '{';
            generated += '\n' + indentation + this.indent(3) + '"ErrorEquals": [ "States.ALL" ],';
            generated += '\n' + indentation + this.indent(3) + '"MaxAttempts": ' + element.getRetryCount() + ',';
            generated += '\n' + indentation + this.indent(3) + '"BackoffRate": 1.0';
            generated += '\n' + indentation + this.indent(2) + '}';
            generated += '\n' + indentation + this.indent(1) + '],';
        }

        if (element.getErrorHandler()) {
            generated += '\n' + indentation + this.indent(1) + '"Catch": ['
            generated += '\n' + indentation + this.indent(2) + '{';
            generated += '\n' + indentation + this.indent(3) + '"ErrorEquals": [ "States.ALL" ],';
            generated += '\n' + indentation + this.indent(3) + '"Next": "' + this.getStateName(element.getErrorHandler().getFirstElement()) + '"';
            generated += '\n' + indentation + this.indent(2) + '}';
            generated += '\n' + indentation + this.indent(1) + '],';
        }

        return generated;
    }

    generateErrorHandler(element, indentation) {
        if (element.getErrorHandler()) {
            const errSeq = element.getErrorHandler().getSequence();
            const lastErrorHandlerElement = errSeq[errSeq.length - 1];
            return this.traverseSequenceBlock(element.getErrorHandler(), indentation, lastErrorHandlerElement.getContinueAfterError());
        }

        return '';
    }
}