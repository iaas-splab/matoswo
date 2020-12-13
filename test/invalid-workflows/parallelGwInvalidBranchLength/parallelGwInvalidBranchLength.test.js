import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';
import {StrictModelValidator} from "../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator";

const wfLocation = 'test/invalid-workflows/parallelGwInvalidBranchLength/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'parallelGwInvalidBranchLength' workflow encounters an error, since some parallel branches are longer than one", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();

            expect(() => smv.validate(mainSequenceBlock))
                .to.throw('ParallelBlock with id: Gateway_0388b5b branch length must be 1');
        });
    });
});