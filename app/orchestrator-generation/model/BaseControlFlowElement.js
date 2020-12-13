export class BaseControlFlowElement {
    
    constructor(type, id, name, inputSchema, outputSchema) {
        this.type = type;
        this.id = id;
        this.name = name;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
    }

    getType() {
        return this.type;
    }
    
    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getInputSchema() {
        return this.inputSchema;
    }

    getOutputSchema() {
        return this.outputSchema;
    }

    getContinueAfterError() {
        return false;
    }
}