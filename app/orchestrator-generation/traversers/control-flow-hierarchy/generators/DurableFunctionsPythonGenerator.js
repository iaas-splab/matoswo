import {
    DEFAULT_BRANCH,
    DEFAULT_DURABLE_FUNCTIONS_TIMEOUT,
    DEFAULT_RETRY_COUNT,
    DEFAULT_RETRY_FIRST_INTERVAL,
    SUB_WORKFLOW_BLOCK,
    TASK
} from '../../../util/Constants';
import {DFPythonConditionGenerator} from '../../condition/generators/DFPythonConditionGenerator';
import {BaseOrchestratorGenerator} from './BaseOrchestratorGenerator';

/**
 * Traverse a control flow hierarchy and generate a Durable Functions workflow definition from the modeled workflow.
 */
export class DurableFunctionsPythonGenerator extends BaseOrchestratorGenerator {

    constructor() {
        super();
        this.hasParaJobsVar = false;
        this.hasDeadlineVar = false;
        this.hasTimeoutVar = false;
        this.hasTimeoutWinnerVar = false;
    }

    generateOrchestrator(name, sequenceBlock) {
        const generatedOrchestrator = this.dispatch(sequenceBlock, this.indent(2)); // generate first, to see if we need additional import
        let generated = 'import azure.functions as func';
        generated += '\nimport azure.durable_functions as df';

        if (this.hasDeadlineVar) {
            generated += '\nfrom datetime import datetime, timedelta';
        }

        generated += '\n\ndef orchestrator_function(context: df.DurableOrchestrationContext):';
        generated += '\n' + this.indent(2) + 'result = context.get_input()';
        generated += generatedOrchestrator;
        generated += '\n' + this.indent(2) + 'return result';
        generated += '\n\nmain = df.Orchestrator.create(orchestrator_function)';
        this.getOutputFiles().push({name: name + '.py', content: generated});
    }

    traverseSequenceBlock(sequenceBlock, indentation, param3) {
        let generated = '';

        for (let element of sequenceBlock.getSequence()) {
            generated += this.dispatch(element, indentation, param3);
        }

        return generated;
    }

    traverseTask(task, indentation) {
        let generated = '';
        const errorHandler = task.getErrorHandler();

        if (errorHandler) {
            generated += '\n' + indentation + 'try:';

            if (task.getTimeoutMilliseconds() && task.getTimeoutMilliseconds !== DEFAULT_DURABLE_FUNCTIONS_TIMEOUT) {
                generated += this.generateTimeout(task, indentation + this.indent(2));
            } else {
                generated += '\n' + indentation + this.indent(2) + 'result = yield ' + this.generateActivity(task, 'result');
            }

            generated += '\n' + indentation + 'except Exception as error:';
            generated += '\n' + indentation + this.indent(2) + 'result = error';
            generated += this.dispatch(errorHandler, indentation + this.indent(2));

            const errSeq = errorHandler.getSequence();
            const lastElemErrSeq = errSeq[errSeq.length - 1];

            if (!lastElemErrSeq.getContinueAfterError()) {
                if (lastElemErrSeq.terminatesWithError) {
                    generated += '\n' + indentation + this.indent(2) + 'raise error';
                } else {
                    generated += '\n' + indentation + this.indent(2) + 'return result';
                }
            }
        } else {
            if (task.getTimeoutMilliseconds() && task.getTimeoutMilliseconds() !== DEFAULT_DURABLE_FUNCTIONS_TIMEOUT) {
                generated += this.generateTimeout(task, indentation);
            } else {
                generated += '\n' + indentation + 'result = yield ' + this.generateActivity(task, 'result');
            }
        }

        return generated;
    }

    traverseSubWorkflowBlock(subWorkflowBlock, indentation, skipGeneratingCall) {
        if (subWorkflowBlock.getSequenceBlock()) {
            this.generateOrchestrator(subWorkflowBlock.getName(), subWorkflowBlock.getSequenceBlock());
        }

        if (skipGeneratingCall) {
            return;
        }

        return this.traverseTask(subWorkflowBlock, indentation); // handling structure is the same as TASK
    }

    traverseDelayTimer(delyTimer, indentation) {
        let generated = '\n' + indentation + this.generateDeadline(delyTimer.getMilliseconds());
        generated += '\n' + indentation + 'yield context.create_timer(deadline)';
        return generated;
    }

    /**
     * durable functions concurrency limits not under our control, so assume default concurrency for other orchestrators as well
     */
    traverseFanoutBlock(fanoutBlock, indentation) {
        let generated = '\n' + indentation + this.generateParaVar();
        generated += '\n' + indentation + 'for item in result.value:';  // composer orchestrator enforces this default
        generated += '\n' + indentation + this.indent(2) + 'tasks.append(';

        const fanoutElement = fanoutBlock.getSequenceBlock().getSequence()[0];
        if (fanoutElement.getType() === SUB_WORKFLOW_BLOCK) {
            this.dispatch(fanoutElement, '', true); // generate the subworkflow without
        }

        generated += this.generateActivity(fanoutElement, 'item') + ')';
        generated += '\n' + indentation + 'result = yield context.task_all(tasks)';
        return generated;
    }

    traverseParallelBlock(parallelBlock, indentation) {
        let generated = '\n' + indentation + this.generateParaVar();

        const paraBlocks = parallelBlock.getBranchSequenceBlocks();
        for (let i = 0; i < paraBlocks.length; i++) {
            generated += '\n' + indentation + 'tasks.append(';

            const paraElement = paraBlocks[i].getSequence()[0];
            if (paraElement.getType() === SUB_WORKFLOW_BLOCK) {
                this.dispatch(paraElement, true);
            }

            generated += this.generateActivity(paraElement, 'result') + ')';
        }

        generated += '\n' + indentation + 'result = yield context.task_all(tasks)';
        return generated;
    }

    traverseLoopBlock(loopBlock, indentation) {
        const ccg = new DFPythonConditionGenerator('result'); // Durable Functions conditions are the same as openwhisk composer
        ccg.traverseCondition(loopBlock.getLoopCondition(), loopBlock);
        const condition = ccg.getGenerated();

        let generated = '\n' + indentation + 'while ' + condition + ':';
        generated += this.dispatch(loopBlock.getSequenceBlock(), indentation + this.indent(2));
        return generated;
    }

    traverseConditionalBlock(conditionalBlock, indentation) {
        const branchSeqs = conditionalBlock.getBranchSequenceBlocks();
        const branchConds = conditionalBlock.getBranchConditions();
        const branchNames = Object.keys(branchSeqs).filter(name => name !== DEFAULT_BRANCH);
        let generated = '';

        for (let i = 0; i < branchNames.length; i++) {
            const branchName = branchNames[i];
            const ccg = new DFPythonConditionGenerator('result');
            ccg.traverseCondition(branchConds[branchName], conditionalBlock);
            const condition = ccg.getGenerated();

            if (i === 0) {
                generated += '\n' + indentation + 'if ' + condition + ':';
            } else {
                generated += ' elif ' + condition + ':';
            }

            generated += this.dispatch(branchSeqs[branchName], indentation + this.indent(2));
        }

        generated += 'else:';
        generated += this.dispatch(branchSeqs[DEFAULT_BRANCH], indentation + this.indent(2));
        return generated;
    }

    generateActivity(activity, parameterName) {
        let generated = '';

        if (activity.getRetryCount() && activity.getRetryCount() !== DEFAULT_RETRY_COUNT) {
            generated += this.generateActivityCall(activity, true) + '("' + activity.getName() + '", ';
            generated += 'df.RetryOptions(' + DEFAULT_RETRY_FIRST_INTERVAL + ', ' + activity.getRetryCount() + '), ' + parameterName + ')';


        } else {
            generated += this.generateActivityCall(activity, false) + '("' + activity.getName() + '", ' + parameterName + ')';
        }

        return generated;
    }

    generateActivityCall(activity, withRetry) {
        if (!withRetry) {
            return (activity.getType() === TASK) ? 'context.call_activity' : 'context.call_sub_orchestrator';
        } else {
            return (activity.getType() === TASK) ? 'context.call_activity_with_retry' : 'context.call_sub_orchestrator_with_retry';
        }
    }

    generateTimeout(activity, indentation) {
        let generated = '\n' + indentation;
        generated += this.generateDeadline(activity.getTimeoutMilliseconds()) + '\n' + indentation;

        if (!this.hasTimeoutVar) {
            this.hasTimeoutVar = true;
        }

        generated += 'timeout_task = context.create_timer(deadline)' + '\n' + indentation;
        generated += 'result = ' + this.generateActivity(activity, 'result') + '\n' + indentation;

        if (!this.hasTimeoutWinnerVar) {
            this.hasTimeoutWinnerVar = true;
        }

        generated += 'winner = yield context.task_any([result, timeout_task])' + '\n\n' + indentation;
        generated += 'if winner == result:' + '\n' + indentation + this.indent(2);
        generated += 'timeout_task.cancel()' + '\n' + indentation + this.indent(2);
        generated += 'result = result.result' + '\n' + indentation;
        generated += 'else:' + '\n' + indentation + this.indent(2);
        generated += 'raise ValueError("Timeout occured")' + '\n' + indentation + '}';
        return generated;
    }

    generateDeadline(milliseconds) {
        if (!this.hasDeadlineVar) {
            this.hasDeadlineVar = true;
        }

        return 'deadline = context.current_utc_datetime + timedelta(milliseconds=' + milliseconds + ')';
    }

    generateParaVar() {
        if (!this.hasParaJobsVar) {
            this.hasParaJobsVar = true;
        }

        return 'tasks = []';
    }
}
