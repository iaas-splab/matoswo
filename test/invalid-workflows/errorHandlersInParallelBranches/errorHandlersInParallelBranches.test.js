import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';
import {StrictModelValidator} from "../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator";

const wfLocation = 'test/invalid-workflows/errorHandlersInParallelBranches/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'errorHandlersInParallelBranches' workflow encounters an error, since no error Handlers are allowed in parallel branches", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();

            expect(() => smv.validate(mainSequenceBlock))
                .to.throw('The activity with id: Activity_1dagjx3 can can not handle errors in parallel blocks, due to inconsistent behavior among orchestrators');
        });
    });
});