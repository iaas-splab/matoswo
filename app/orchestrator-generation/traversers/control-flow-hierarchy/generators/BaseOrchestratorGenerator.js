import {BaseControlFlowHierarchyTraverser} from "../BaseControlFlowHierarchyTraverser";

/**
 * Provide basic functionality for generating orchestrators from a control flow hierarchy and retrieving the results.
 * Additional generators for new orchestrators could be written similar to the sub-classes of this class.
 */
export class BaseOrchestratorGenerator extends BaseControlFlowHierarchyTraverser {

    constructor() {
        super();
        this.outputFiles = [];
    }

    getOutputFiles() {
        return this.outputFiles;
    }

    indent(num) {
        return '  '.repeat(num);
    }

    generateOrchestrator(name, sequenceBlock, param3) {
        
    }
}