import {
    DEFAULT_BRANCH,
    DEFAULT_DURABLE_FUNCTIONS_TIMEOUT,
    DEFAULT_RETRY_COUNT,
    DEFAULT_RETRY_FIRST_INTERVAL,
    SUB_WORKFLOW_BLOCK,
    TASK
} from '../../../util/Constants';
import {ComposerConditionGenerator} from '../../condition/generators/ComposerConditionGenerator';
import {BaseOrchestratorGenerator} from './BaseOrchestratorGenerator';

/**
 * Traverse a control flow hierarchy and generate a Durable Functions workflow definition from the modeled workflow.
 */
export class DurableFunctionsGenerator extends BaseOrchestratorGenerator {

    constructor() {
        super();
        this.hasParaJobsVar = false;
        this.hasDeadlineVar = false;
        this.hasTimeoutVar = false;
        this.hasTimeoutWinnerVar = false;
    }

    generateOrchestrator(name, sequenceBlock) {
        const generatedOrchestrator = this.dispatch(sequenceBlock, this.indent(2)); // generate first, to see if we need additional import
        let generated = 'const df = require("durable-functions")';

        if (this.hasDeadlineVar) {
            generated += '\nconst moment = require("moment")';
        }

        generated += '\n\nmodule.exports = df.orchestrator(function* (context) {';
        generated += '\n' + this.indent(2) + 'let result = context.df.getInput()';
        generated += generatedOrchestrator;
        generated += '\n' + this.indent(2) + 'return result' + '\n})';
        this.getOutputFiles().push({name: name + '.js', content: generated});
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
            generated += '\n' + indentation + 'try {';

            if (task.getTimeoutMilliseconds() && task.getTimeoutMilliseconds !== DEFAULT_DURABLE_FUNCTIONS_TIMEOUT) {
                generated += this.generateTimeout(task, indentation + this.indent(2));
            } else {
                generated += '\n' + indentation + this.indent(2) + 'result = yield ' + this.generateActivity(task, 'result');
            }

            generated += '\n' + indentation + '} catch (error) {';
            generated += '\n' + indentation + this.indent(2) + 'result = error';
            generated += this.dispatch(errorHandler, indentation + this.indent(2));

            const errSeq = errorHandler.getSequence();
            const lastElemErrSeq = errSeq[errSeq.length - 1];

            if (!lastElemErrSeq.getContinueAfterError()) {
                if (lastElemErrSeq.terminatesWithError) {
                    generated += '\n' + indentation + this.indent(2) + 'throw error';
                } else {
                    generated += '\n' + indentation + this.indent(2) + 'return result';
                }
            }

            generated += '\n' + indentation + '}';
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
        generated += '\n' + indentation + 'yield context.df.createTimer(deadline.toDate())';
        return generated;
    }

    /**
     * durable functions concurrency limits not under our control, so assume default concurrency for other orchestrators as well
     */
    traverseFanoutBlock(fanoutBlock, indentation) {
        let generated = '\n' + indentation + this.generateParaVar();
        generated += '\n' + indentation + 'for (let item of result.value) {';  // composer orchestrator enforces this default
        generated += '\n' + indentation + this.indent(2) + 'tasks.push(';

        const fanoutElement = fanoutBlock.getSequenceBlock().getSequence()[0];
        if (fanoutElement.getType() === SUB_WORKFLOW_BLOCK) {
            this.dispatch(fanoutElement, '', true); // generate the subworkflow without
        }

        generated += this.generateActivity(fanoutElement, 'item') + ')';
        generated += '\n' + indentation + '}';
        generated += '\n' + indentation + 'result = yield context.df.Task.all(tasks)';
        return generated;
    }

    traverseParallelBlock(parallelBlock, indentation) {
        let generated = '\n' + indentation + this.generateParaVar();

        const paraBlocks = parallelBlock.getBranchSequenceBlocks();
        for (let i = 0; i < paraBlocks.length; i++) {
            generated += '\n' + indentation + 'tasks.push(';

            const paraElement = paraBlocks[i].getSequence()[0];
            if (paraElement.getType() === SUB_WORKFLOW_BLOCK) {
                this.dispatch(paraElement, true);
            }

            generated += this.generateActivity(paraElement, 'result') + ')';
        }

        generated += '\n' + indentation + 'result = yield context.df.Task.all(tasks)';
        return generated;
    }

    traverseLoopBlock(loopBlock, indentation) {
        const ccg = new ComposerConditionGenerator('result'); // Durable Functions conditions are the same as openwhisk composer
        ccg.traverseCondition(loopBlock.getLoopCondition(), loopBlock);
        const condition = ccg.getGenerated();

        let generated = '\n' + indentation + 'while (' + condition + ') {';
        generated += this.dispatch(loopBlock.getSequenceBlock(), indentation + this.indent(2));
        generated += '\n' + indentation + '}';
        return generated;
    }

    traverseConditionalBlock(conditionalBlock, indentation) {
        const branchSeqs = conditionalBlock.getBranchSequenceBlocks();
        const branchConds = conditionalBlock.getBranchConditions();
        const branchNames = Object.keys(branchSeqs).filter(name => name !== DEFAULT_BRANCH);
        let generated = '';

        for (let i = 0; i < branchNames.length; i++) {
            const branchName = branchNames[i];
            const ccg = new ComposerConditionGenerator('result');
            ccg.traverseCondition(branchConds[branchName], conditionalBlock);
            const condition = ccg.getGenerated();

            if (i === 0) {
                generated += '\n' + indentation + 'if (' + condition + ') {';
            } else {
                generated += ' else if (' + condition + ') {';
            }

            generated += this.dispatch(branchSeqs[branchName], indentation + this.indent(2));
            generated += '\n' + indentation + '}';
        }

        generated += ' else { ';
        generated += this.dispatch(branchSeqs[DEFAULT_BRANCH], indentation + this.indent(2));
        generated += '\n' + indentation + '}';
        return generated;
    }

    generateActivity(activity, parameterName) {
        let generated = '';

        if (activity.getRetryCount() && activity.getRetryCount() !== DEFAULT_RETRY_COUNT) {
            generated += this.generateActivityCall(activity) + 'WithRetry("' + activity.getName() + '", ';
            generated += 'new df.RetryOptions(' + DEFAULT_RETRY_FIRST_INTERVAL + ', ' + activity.getRetryCount() + '), ' + parameterName + ')'
        } else {
            generated += this.generateActivityCall(activity) + '("' + activity.getName() + '", ' + parameterName + ')';
        }

        return generated;
    }

    generateActivityCall(activity) {
        return (activity.getType() === TASK) ? 'context.df.callActivity' : 'context.df.callSubOrchestrator';
    }

    generateTimeout(activity, indentation) {
        let generated = '\n' + indentation;
        generated += this.generateDeadline(activity.getTimeoutMilliseconds()) + '\n' + indentation;

        if (!this.hasTimeoutVar) {
            this.hasTimeoutVar = true;
            generated += 'let ';
        }

        generated += 'timeoutTask = context.df.createTimer(deadline.toDate())' + '\n' + indentation;
        generated += 'result = ' + this.generateActivity(activity, 'result') + '\n' + indentation;

        if (!this.hasTimeoutWinnerVar) {
            this.hasTimeoutWinnerVar = true;
            generated += 'let ';
        }

        generated += 'winner = yield context.df.Task.any([result, timeoutTask])' + '\n\n' + indentation;
        generated += 'if (winner === result) {' + '\n' + indentation + this.indent(2);
        generated += 'timeoutTask.cancel()' + '\n' + indentation + this.indent(2);
        generated += 'result = result.result' + '\n' + indentation;
        generated += '} else {' + '\n' + indentation + this.indent(2);
        generated += 'throw new Error("Timeout occured")' + '\n' + indentation + '}';
        return generated;
    }

    generateDeadline(milliseconds) {
        if (!this.hasDeadlineVar) {
            this.hasDeadlineVar = true;
            return 'let deadline = moment.utc(context.df.currentUtcDateTime).add(' + milliseconds + ', "ms")';
        }

        return 'deadline = moment.utc(context.df.currentUtcDateTime).add(' + milliseconds + ', "ms")';
    }

    generateParaVar() {
        if (!this.hasParaJobsVar) {
            this.hasParaJobsVar = true;
            return 'let tasks = []';
        }

        return 'tasks = []';
    }
}