import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';

const wfLocation = 'test/invalid-workflows/unmatchedGwBranches/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'unmatchedGwBranches' workflow encounters an error for a closing gateway with unmatched branches", function () {
            expect(() => buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation))
                .to.throw('The gateway with id: Gateway_0xhkj4b is not a matching closing gateway');
        });
    });
});