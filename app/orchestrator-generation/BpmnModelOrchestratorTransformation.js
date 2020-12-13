import BpmnModdle from 'bpmn-moddle';
import JSZip from 'jszip';
import {ControlFlowHierarchyBuilder} from './builders/ControlFlowHierarchyBuilder';
import {ProcessExtractor} from './extractors/ProcessExtractor';

export class BpmnModelOrchestratorTransformation {

    /**
     *  Generate a zip archives from a list of files.
     */
    async generateZip(files) {
        let zip = new JSZip();
        
        for (let f of files) {
            zip.file(f.name, f.content);
        }
        
        return zip.generateAsync({ type: 'base64' });
    }

    /**
     * Convert bpmn xml ('bpmnXml') representing a serverless workflow to a specific serverless orchestrator
     * using the supplied 'generator' and validating the process according
     * to a list of supplied 'validators'.
     */
    async convertXmlToOrchestrator(bpmnXml, generator, validators=[]) {
        const moddle = new BpmnModdle();
        const { rootElement: definitions } = await moddle.fromXML(bpmnXml);
        return this.convertJsonToOrchestrator(definitions, generator, validators);
    }

    /**
     * Convert bpmn json ('bpmnJson') representing a serverless workflow to a specific serverless orchestrator
     * using the supplied 'generator' and validating the process according
     * to a list of supplied 'validators'.
     */
    async convertJsonToOrchestrator(bpmnJson, generator, validators=[]) {
        const processExtractor = new ProcessExtractor();
        const sp = processExtractor.extractSimplified(bpmnJson.rootElements[0]);
        console.log(sp) // simplified process model

        const cfhb = new ControlFlowHierarchyBuilder();
        const mainSequenceBlock = cfhb.buildControlFlowHierarchy(sp);

        for (let validator of validators) {
            validator.validate(mainSequenceBlock);
        }

        let name = 'main-orchestrator';

        if (bpmnJson.rootElements[0].name && bpmnJson.rootElements[0].name.trim().length > 0) {
            name = bpmnJson.rootElements[0].name;
        }
        
        generator.generateOrchestrator(name, mainSequenceBlock);
        return this.generateZip(generator.getOutputFiles());
    }
}