import { CONDITIONAL_BLOCK, TASK, PARALLEL_BLOCK } from '../../../app/orchestrator-generation/util/Constants';
import { StepFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/StepFunctionsGenerator';
import { DurableFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/DurableFunctionsGenerator';
import { ComposerGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/ComposerGenerator';
import { StrictModelValidator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator';

import { expect } from 'chai';
import fs  from 'fs';

import { buildControlFlowHierarchyFromSimplifiedProcessModel, getOrchestratorDict } from '../../helper';

const wfLocation = 'test/valid-workflows/complex2/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'complex2' workflow produces a correct control flow hierarchy", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);

            expect(mainSequenceBlock.sequence.length).equal(3);

            expect(mainSequenceBlock.sequence[0].type).equal(TASK);
            expect(mainSequenceBlock.sequence[0].name).equal("Task1");

            expect(mainSequenceBlock.sequence[2].type).equal(TASK);
            expect(mainSequenceBlock.sequence[2].name).equal("Task5");

            const outerConditionalBlock = mainSequenceBlock.sequence[1];
            expect(outerConditionalBlock.type).equal(CONDITIONAL_BLOCK);

            expect(Object.keys(outerConditionalBlock.branchSequenceBlocks).length).equal(2);
            expect(Object.keys(outerConditionalBlock.branchConditions).length).equal(1); // default branch has no condition

            expect(outerConditionalBlock.branchSequenceBlocks["b1"].sequence[0].name).equal("Task7");

            const innerConditionalBlock = outerConditionalBlock.branchSequenceBlocks["default"].sequence[0];
            expect(innerConditionalBlock.type).equal(CONDITIONAL_BLOCK);

            expect(Object.keys(innerConditionalBlock.branchSequenceBlocks).length).equal(2);
            expect(Object.keys(innerConditionalBlock.branchConditions).length).equal(1); // default branch has no condition

            expect(innerConditionalBlock.branchSequenceBlocks["b1"].sequence[0].name).equal("Task6");

            const innerConditionalSequenceBlock  = innerConditionalBlock.branchSequenceBlocks["default"];
            expect(innerConditionalSequenceBlock.sequence.length).equal(2);
            expect(innerConditionalSequenceBlock.sequence[0].type).equal(TASK);
            expect(innerConditionalSequenceBlock.sequence[0].name).equal("Task2");

            const parallelBlock = innerConditionalSequenceBlock.sequence[1];
            expect(parallelBlock.type).equal(PARALLEL_BLOCK);
            expect(parallelBlock.branchSequenceBlocks.length).equal(2);
        });
    });
});

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'complex2' workflow is validated without errors", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();
            smv.validate(mainSequenceBlock); // when no error/exception occurs, validation was successful
        });
    });
});

describe("StepFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex2' workflow produces expected step functions orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const sfg = new StepFunctionsGenerator();
            sfg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(sfg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(1);
            expect(orchestrators["main-orchestrator.asl"]).equal(fs.readFileSync(wfLocation + 'stepFunctions.asl', { encoding: 'utf8' }));
        });
    });
});

describe("DurableFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex2' workflow produces expected durable functions orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const dfg = new DurableFunctionsGenerator();
            dfg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(dfg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(1);
            expect(orchestrators["main-orchestrator.js"]).equal(fs.readFileSync(wfLocation + 'durableFunctions.js', { encoding: 'utf8' }));
        });
    });
});

describe("ComposerGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'complex2' workflow produces expected composer orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const cg = new ComposerGenerator();
            cg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(cg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(1);
            expect(orchestrators["main-orchestrator.js"]).equal(fs.readFileSync(wfLocation + 'composer.js', { encoding: 'utf8' }));
        });
    });
});