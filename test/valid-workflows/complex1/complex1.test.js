import {
    LOOP_BLOCK,
    CONDITIONAL_BLOCK,
    TASK,
    PARALLEL_BLOCK,
    SUB_WORKFLOW_BLOCK
} from '../../../app/orchestrator-generation/util/Constants';
import { StepFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/StepFunctionsGenerator';
import { DurableFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/DurableFunctionsGenerator';
import { ComposerGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/ComposerGenerator';
import { StrictModelValidator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator';

import { expect } from 'chai';
import fs  from 'fs';

import { buildControlFlowHierarchyFromSimplifiedProcessModel, getOrchestratorDict } from '../../helper';

const wfLocation = 'test/valid-workflows/complex1/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'complex1' workflow produces a correct control flow hierarchy", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);

            expect(mainSequenceBlock.sequence.length).equal(3);

            expect(mainSequenceBlock.sequence[0].type).equal(TASK);
            expect(mainSequenceBlock.sequence[0].name).equal("T1");
            expect(mainSequenceBlock.sequence[0].errorHandler.sequence.length).equal(1);

            expect(mainSequenceBlock.sequence[2].type).equal(TASK);
            expect(mainSequenceBlock.sequence[2].name).equal("ET");
            expect(mainSequenceBlock.sequence[2].errorHandler.sequence.length).equal(1);

            const conditionalBlock = mainSequenceBlock.sequence[1];
            expect(conditionalBlock.type).equal(CONDITIONAL_BLOCK);
            expect(Object.keys(conditionalBlock.branchSequenceBlocks).length).equal(2);
            expect(conditionalBlock.branchSequenceBlocks["b1"].sequence[0].type).equal(LOOP_BLOCK);
            expect(conditionalBlock.branchSequenceBlocks["b1"].sequence[0].sequenceBlock.sequence[0].type).equal(SUB_WORKFLOW_BLOCK);

            const defaultBranch = conditionalBlock.branchSequenceBlocks["default"];
            expect(defaultBranch.sequence[0].type).equal(PARALLEL_BLOCK);

            expect(defaultBranch.sequence[0].branchSequenceBlocks.length).equal(2);
        });
    });
});

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'complex1' workflow is validated without errors", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();
            smv.validate(mainSequenceBlock); // when no error/exception occurs, validation was successful
        });
    });
});

describe("StepFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex1' workflow produces expected step functions orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const sfg = new StepFunctionsGenerator();
            sfg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(sfg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(3);
            expect(orchestrators["main-orchestrator.asl"]).equal(fs.readFileSync(wfLocation + 'AWS_StepFunctions/main-orchestrator.asl', { encoding: 'utf8' }));
            expect(orchestrators["PT2.asl"]).equal(fs.readFileSync(wfLocation + 'AWS_StepFunctions/PT2.asl', { encoding: 'utf8' }));
            expect(orchestrators["C2.asl"]).equal(fs.readFileSync(wfLocation + 'AWS_StepFunctions/C2.asl', { encoding: 'utf8' }));
        });
    });
});

describe("DurableFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex1' workflow produces expected durable functions orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const dfg = new DurableFunctionsGenerator();
            dfg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(dfg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(3);
            expect(orchestrators["main-orchestrator.js"]).equal(fs.readFileSync(wfLocation + 'Azure_DurableFunctions/main-orchestrator.js', { encoding: 'utf8' }));
            expect(orchestrators["PT2.js"]).equal(fs.readFileSync(wfLocation + 'Azure_DurableFunctions/PT2.js', { encoding: 'utf8' }));
            expect(orchestrators["C2.js"]).equal(fs.readFileSync(wfLocation + 'Azure_DurableFunctions/C2.js', { encoding: 'utf8' }));
        });
    });
});

describe("ComposerGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex1' workflow produces expected composer orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const cg = new ComposerGenerator();
            cg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(cg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(3);
            expect(orchestrators["main-orchestrator.js"]).equal(fs.readFileSync(wfLocation + 'OpenWhisk_Composer/main-orchestrator.js', { encoding: 'utf8' }));
            expect(orchestrators["PT2.js"]).equal(fs.readFileSync(wfLocation + 'OpenWhisk_Composer/PT2.js', { encoding: 'utf8' }));
            expect(orchestrators["C2.js"]).equal(fs.readFileSync(wfLocation + 'OpenWhisk_Composer/C2.js', { encoding: 'utf8' }));
        });
    });
});