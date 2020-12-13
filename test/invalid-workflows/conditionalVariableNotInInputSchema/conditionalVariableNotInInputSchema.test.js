import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';
import {StrictModelValidator} from "../../../app/orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator";

const wfLocation = 'test/invalid-workflows/conditionalVariableNotInInputSchema/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("StrictModelValidator", function () {
    describe("validate", function () {
        it("'conditionalVariableNotInInputSchema' workflow encounters an error since the conditional branch mapping uses undeclared variables, while using an input schema", function () {
            const mainSequenceBlock = buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation);
            const smv = new StrictModelValidator();
            expect(() => smv.validate(mainSequenceBlock))
                .to.throw('ConditionalBlock with id: Gateway_0ea1v07 used conditional variablex not defined in its input schema');
        });
    });
});