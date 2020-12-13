import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';

const wfLocation = 'test/invalid-workflows/noDefaultBranchConditionalGw/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'noDefaultBranchConditionalGw' workflow encounters an error, since there is no default branch", function () {
            expect(() => buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation))
                .to.throw('No default branch found for bpmn:ExclusiveGateway with id: Gateway_0ea1v07');
        });
    });
});