import {
    DEFAULT_BRANCH,
    DEFAULT_COMPOSER_TIMEOUT,
    DEFAULT_DURABLE_FUNCTIONS_TIMEOUT,
    DEFAULT_RETRY_COUNT
} from '../../../util/Constants';
import {ComposerConditionGenerator} from '../../condition/generators/ComposerConditionGenerator';
import {BaseOrchestratorGenerator} from './BaseOrchestratorGenerator';

/**
 * Traverse a control flow hierarchy and generate a Composer workflow definition from the modeled workflow.
 */
export class ComposerGenerator extends BaseOrchestratorGenerator {
    constructor(useCloudComposer = false) {
        super();
        this.isCloudComposer = useCloudComposer;
    }

    generateOrchestrator(name, sequenceBlock) {
        let requiredImport;
        this.isCloudComposer ? requiredImport = 'require(\'@ibm-functions/composer\')' : requiredImport = 'require(\'openwhisk-composer\')';
        let generated = 'const composer = ' + requiredImport;
        generated += '\n\nmodule.exports = ';
        generated += this.dispatch(sequenceBlock, '');
        this.getOutputFiles().push({name: name + '.js', content: generated});
    }

    traverseSequenceBlock(sequenceBlock, indentation) {
        const sequence = sequenceBlock.getSequence();
        let generated = '';

        if (sequence.length === 0) {
            generated += 'composer.empty()';
        } else if (sequence.length === 1) {
            generated += this.dispatch(sequence[0], indentation);
        } else {
            generated += indentation + 'composer.sequence(\n';

            for (let i = 0; i < sequence.length; i++) {
                generated += this.dispatch(sequence[i], indentation + this.indent(2));
                generated += (i < sequence.length - 1) ? ',\n' : '\n' + indentation + ')';
            }
        }

        return generated;
    }

    traverseTask(task, indentation) {
        let generated = '';
        generated += 'composer.action(\'' + task.getName() + '\'';

        if (task.getTimeoutMilliseconds() && task.getTimeoutMilliseconds() !== DEFAULT_COMPOSER_TIMEOUT) {
            generated += ', { limits: { timeout: ' + task.getTimeoutMilliseconds() + ' } }';
        } else {
            generated += ', { limits: { timeout: ' + DEFAULT_DURABLE_FUNCTIONS_TIMEOUT + ' } }';
        }

        generated += ')';

        if (task.getRetryCount() && task.getRetryCount() !== DEFAULT_RETRY_COUNT) {
            generated = 'composer.retry(' + task.getRetryCount() + ', ' + generated + ')';
        }

        if (task.getErrorHandler()) {
            generated = 'composer.try(\n' + indentation + this.indent(2) + generated + ',\n'
            generated += this.dispatch(task.getErrorHandler(), indentation + this.indent(2))
            generated += '\n' + indentation + ')';
        }

        return indentation + generated;
    }

    traverseSubWorkflowBlock(subWorkflowBlock, indentation) {
        if (subWorkflowBlock.getSequenceBlock()) {
            this.generateOrchestrator(subWorkflowBlock.getName(), subWorkflowBlock.getSequenceBlock());
        }

        return this.traverseTask(subWorkflowBlock, indentation); // subWorkflow generator output is exactly the same as task
    }

    traverseDelayTimer(delayTimer, indentation) {
        let generated = indentation + 'composer.function(function(input) { ';
        generated += 'const date = Date.now(); let now = null; do { now = Date.now(); } ';
        generated += 'while (now - date < ' + delayTimer.getMilliseconds() + '); return input; })';
        return generated;
    }

    traverseFanoutBlock(fanoutBlock, indentation) {
        let generated = indentation + 'composer.map(\n';
        generated += this.dispatch(fanoutBlock.getSequenceBlock(), indentation + this.indent(2));
        generated += '\n' + indentation + ')';
        return generated;
    }

    traverseParallelBlock(parallelBlock, indentation) {
        let generated = indentation + 'composer.parallel(\n';
        const paraBlocks = parallelBlock.getBranchSequenceBlocks();

        for (let i = 0; i < paraBlocks.length; i++) {
            generated += this.dispatch(paraBlocks[i], indentation + this.indent(2));
            generated += (i < paraBlocks.length - 1) ? ',\n' : '';
        }

        generated += '\n' + indentation + ')';
        return generated;
    }

    traverseLoopBlock(loopBlock, indentation) {
        const condition = this.generateCondition('params', loopBlock.getLoopCondition(), loopBlock);
        let generated = indentation + 'composer.while(params => ' + condition + ',\n';
        generated += this.dispatch(loopBlock.getSequenceBlock(), indentation + this.indent(2));
        generated += '\n' + indentation + ')';
        return generated;
    }

    traverseConditionalBlock(conditionalBlock, indentation) {
        const branchSeqs = conditionalBlock.getBranchSequenceBlocks();
        const branchConds = conditionalBlock.getBranchConditions();
        const branchNames = Object.keys(branchSeqs).filter(name => name !== DEFAULT_BRANCH);
        let generated = '';

        // if within if within if to accomplish if-elseif-else structure
        for (let i = 0; i < branchNames.length; i++) {
            const branchName = branchNames[i];
            const condition = this.generateCondition('params', branchConds[branchName], conditionalBlock);
            generated += indentation + this.indent(i * 2) + 'composer.if(params => ' + condition + ',\n';
            generated += this.dispatch(branchSeqs[branchName], indentation + this.indent(i * 2 + 2));
            generated += (i < branchNames.length - 1) ? ',\n' : ',\n' + this.dispatch(branchSeqs[DEFAULT_BRANCH], indentation + this.indent(i * 2 + 2));
        }

        for (let i = branchNames.length - 1; i >= 0; i--) {
            generated += '\n' + indentation + this.indent(i * 2) + ')';
        }

        return generated;
    }

    generateCondition(inputObjectName, condition, conditionContainingElement) {
        const ccg = new ComposerConditionGenerator(inputObjectName);
        ccg.traverseCondition(condition, conditionContainingElement);
        return ccg.getGenerated();
    }
}
