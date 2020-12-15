import { LOOP_BLOCK, CONDITIONAL_BLOCK, TASK } from '../../../app/orchestrator-generation/util/Constants';
import { StepFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/StepFunctionsGenerator';
import { DurableFunctionsGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/DurableFunctionsGenerator';
import { ComposerGenerator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/generators/ComposerGenerator';
import { StrictModelValidator } from '../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator';

import { expect } from 'chai';
import fs  from 'fs';

import { buildControlFlowHierarchyFromSimplifiedProcessModel, getOrchestratorDict } from '../../helper';

const wfLocation = 'test/valid-workflows/conditional/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'conditional' workflow produces a correct control flow hierarchy", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);

            expect(mainSequenceBlock.sequence.length).equal(2);

            expect(mainSequenceBlock.sequence[0].type).equal(LOOP_BLOCK);
            expect(mainSequenceBlock.sequence[0].sequenceBlock.sequence[0].type).equal(TASK);

            expect(mainSequenceBlock.sequence[1].type).equal(CONDITIONAL_BLOCK);
            expect(Object.keys(mainSequenceBlock.sequence[1].branchSequenceBlocks).length).equal(3);
            expect(Object.keys(mainSequenceBlock.sequence[1].branchConditions).length).equal(2); // default branch has no condition
            expect(mainSequenceBlock.sequence[1].branchSequenceBlocks["LT10"].sequence[0].name).equal("TaskLessThan10");
            expect(mainSequenceBlock.sequence[1].branchSequenceBlocks["GT10"].sequence[0].name).equal("TaskGreaterThan10");
            expect(mainSequenceBlock.sequence[1].branchSequenceBlocks["default"].sequence[0].name).equal("TaskElseIs10");
        });
    });
});

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'conditional' workflow is validated without errors", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();
            smv.validate(mainSequenceBlock); // when no error/exception occurs, validation was successful
        });
    });
});

describe("StepFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'conditional' workflow produces expected step functions orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const sfg = new StepFunctionsGenerator();
            sfg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(sfg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(1);
            console.log(orchestrators["main-orchestrator.asl"])
            expect(orchestrators["main-orchestrator.asl"]).equal(fs.readFileSync(wfLocation + 'stepFunctions.asl', { encoding: 'utf8' }));
        });
    });
});

describe("DurableFunctionsGenerator", function () {
    describe("generateOrchestrator", function () {
        it("'conditional' workflow produces expected durable functions orchestrator", function () {
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
        it("'conditional' workflow produces expected composer orchestrator", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const cg = new ComposerGenerator();
            cg.generateOrchestrator('main-orchestrator', mainSequenceBlock);
            const orchestrators = getOrchestratorDict(cg.getOutputFiles());

            expect(Object.keys(orchestrators).length).equal(1);
            expect(orchestrators["main-orchestrator.js"]).equal(fs.readFileSync(wfLocation + 'composer.js', { encoding: 'utf8' }));
        });
    });
});