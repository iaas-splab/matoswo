import {ControlFlowHierarchyBuilder} from "../app/orchestrator-generation/builders/ControlFlowHierarchyBuilder";
import fs from "fs";

export function buildControlFlowHierarchyFromSimplifiedProcessModel(modelLocation) {
    const cfhb = new ControlFlowHierarchyBuilder();
    const simplifiedProcess = JSON.parse(fs.readFileSync(modelLocation, { encoding: 'utf8' }));
    return cfhb.buildControlFlowHierarchy(simplifiedProcess);
}

export function getOrchestratorDict(orchestratorFiles) {
    const orchestratorDict = {};

    for (let i = 0; i < orchestratorFiles.length; i++) {
        orchestratorDict[orchestratorFiles[i].name] = orchestratorFiles[i].content;
    }

    return orchestratorDict;
}