import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';

const wfLocation = 'test/invalid-workflows/branchNameAndConditionMapNotMatching/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'branchNameAndConditionMapNotMatching' workflow encounters an error since the branch names and conditional mapping do not match", function () {
            expect(() => buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation))
                .to.throw('Branch name: b1 of condition map does not have a sequence for bpmn:ExclusiveGateway with id: Gateway_0ea1v07');
        });
    });
});