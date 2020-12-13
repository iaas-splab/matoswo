import { expect } from 'chai';

import { buildControlFlowHierarchyFromSimplifiedProcessModel } from '../../helper';

const wfLocation = 'test/invalid-workflows/wrongGwType/';
const spLocation = wfLocation + 'simplifiedProcess.json';

describe("ControlFlowHierarchyBuilder", function () {
    describe("buildControlFlowHierarchy", function () {
        it("'wrongGwType' workflow encounters an error for incorrect closing gateway type", function () {
            expect(() => buildControlFlowHierarchyFromSimplifiedProcessModel(spLocation))
                .to.throw('The gateway with id: Gateway_1xztx04 is not a matching closing gateway');
        });
    });
});