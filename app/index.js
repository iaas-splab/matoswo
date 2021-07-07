import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from './provider/matoswo';
import matoswoModdleDescriptor from './descriptors/matoswo';

import {debounce} from 'min-dash';

import diagramXML from './resources/newDiagram.bpmn';

import {BpmnModelOrchestratorTransformation} from './orchestrator-generation/BpmnModelOrchestratorTransformation';
import {StrictModelValidator} from './orchestrator-generation/traversers/control-flow-hierarchy/validators/StrictModelValidator';
import {StepFunctionsGenerator} from './orchestrator-generation/traversers/control-flow-hierarchy/generators/StepFunctionsGenerator';
import {DurableFunctionsGenerator} from './orchestrator-generation/traversers/control-flow-hierarchy/generators/DurableFunctionsGenerator';
import {DurableFunctionsPythonGenerator} from './orchestrator-generation/traversers/control-flow-hierarchy/generators/DurableFunctionsPythonGenerator';
import {ComposerGenerator} from './orchestrator-generation/traversers/control-flow-hierarchy/generators/ComposerGenerator';

var container = $('#js-drop-zone');

var bpmnModeler = new BpmnModeler({
    container: '#js-canvas',
    propertiesPanel: {
        parent: '#js-properties-panel'
    },
    additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule
    ],
    moddleExtensions: {
        matoswo: matoswoModdleDescriptor
    }
});

function createNewDiagram() {
    openDiagram(diagramXML);
}

async function openDiagram(xml) {
    try {
        await bpmnModeler.importXML(xml);
        container
            .removeClass('with-error')
            .addClass('with-diagram');
    } catch (err) {
        container
            .removeClass('with-diagram')
            .addClass('with-error');
        container.find('.error pre').text(err.message);
        console.error(err);
    }
}

function registerFileDrop(container, callback) {
    function handleFileSelect(e) {
        e.stopPropagation();
        e.preventDefault();

        var files = e.dataTransfer.files;
        var file = files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            var xml = e.target.result;
            callback(xml);
        };

        reader.readAsText(file);
    }

    function handleDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    container.get(0).addEventListener('dragover', handleDragOver, false);
    container.get(0).addEventListener('drop', handleFileSelect, false);
}

////// file drag / drop ///////////////////////
// check file api availability
if (!window.FileList || !window.FileReader) {
    window.alert(
        'Looks like you use an older browser that does not support drag and drop. ' +
        'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
    registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions
$(function () {
    $('#js-create-diagram').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        createNewDiagram();
    });

    var downloadLink = $('#js-download-diagram');
    var downloadSvgLink = $('#js-download-svg');
    var downloadStepFunctionsLink = $('#js-download-aws-step-functions');
    var downloadDurableFunctionsLink = $('#js-download-azure-durable-functions');
    var downloadDurablePythonFunctionsLink = $('#js-download-azure-durable-python-functions');
    var downloadOpenWhiskComposerLink = $('#js-download-apache-openwhisk-composer');
    var downloadIBMComposerLink = $('#js-download-ibm-composer');

    $('.buttons a').click(function (e) {
        if (!$(this).is('.active')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    function setEncoded(link, name, data) {
        var encodedData = encodeURIComponent(data);
        var hrefAttribute = 'data:application/bpmn20-xml;charset=UTF-8,';
        if (name.endsWith('.zip')) {
            hrefAttribute = 'data:application/zip;base64,';
        }

        if (data) {
            link.addClass('active').attr({
                'href': hrefAttribute + encodedData,
                'download': name
            });
        } else {
            link.removeClass('active');
        }
    }

    var exportArtifacts = debounce(async function () {
        try {
            const {svg} = await bpmnModeler.saveSVG();
            setEncoded(downloadSvgLink, 'diagram.svg', svg);
        } catch (err) {
            console.error('Error happened saving SVG: ', err);
            setEncoded(downloadSvgLink, 'diagram.svg', null);
        }

        try {
            const {xml} = await bpmnModeler.saveXML({format: true});
            setEncoded(downloadLink, 'diagram.bpmn', xml);
        } catch (err) {
            console.error('Error happened saving diagram: ', err);
            setEncoded(downloadLink, 'diagram.bpmn', null);
        }

        /////////////////////////////////////////////////////////////////////////////////////
        // generate the workflow definitions from the bpmn and make available for download //
        // as zip archives at their respective download buttons                            //
        /////////////////////////////////////////////////////////////////////////////////////

        try {
            const bpmnJson = bpmnModeler.get('canvas').getRootElement().businessObject.$parent;
            const awsAccountId = bpmnJson.rootElements[0].awsAccountId;
            const awsAccountRegion = bpmnJson.rootElements[0].awsAccountRegion;
            const btoc = new BpmnModelOrchestratorTransformation();

            setEncoded(
                downloadStepFunctionsLink,
                'AWS_StepFunctions.zip',
                await btoc.convertJsonToOrchestrator(bpmnJson, new StepFunctionsGenerator(awsAccountId, awsAccountRegion), [new StrictModelValidator()])
            );
        } catch (err) {
            console.error('Error happened saving generated Step Functions workflow definition: ', err);
            setEncoded(downloadStepFunctionsLink, 'AWS_StepFunctions.zip', null);
        }

        try {
            const bpmnJson = bpmnModeler.get('canvas').getRootElement().businessObject.$parent;
            const btoc = new BpmnModelOrchestratorTransformation();

            setEncoded(
                downloadDurableFunctionsLink,
                'Azure_DurableFunctions.zip',
                await btoc.convertJsonToOrchestrator(bpmnJson, new DurableFunctionsGenerator(), [new StrictModelValidator()])
            );
        } catch (err) {
            console.error('Error happened saving generated Durable Functions workflow definition: ', err);
            setEncoded(downloadDurableFunctionsLink, 'Azure_DurableFunctions.zip', null);
        }

        try {
            const bpmnJson = bpmnModeler.get('canvas').getRootElement().businessObject.$parent;
            const btoc = new BpmnModelOrchestratorTransformation();

            setEncoded(
                downloadDurablePythonFunctionsLink,
                'Azure_DurableFunctionsPython.zip',
                await btoc.convertJsonToOrchestrator(bpmnJson, new DurableFunctionsPythonGenerator(), [new StrictModelValidator()])
            );
        } catch (err) {
            console.error('Error happened saving generated Durable Functions Python workflow definition: ', err);
            setEncoded(downloadDurableFunctionsLink, 'Azure_DurableFunctionsPython.zip', null);
        }

        try {
            const bpmnJson = bpmnModeler.get('canvas').getRootElement().businessObject.$parent;
            const btoc = new BpmnModelOrchestratorTransformation();

            setEncoded(
                downloadOpenWhiskComposerLink,
                'OpenWhisk_Composer.zip',
                await btoc.convertJsonToOrchestrator(bpmnJson, new ComposerGenerator(), [new StrictModelValidator()])
            );
        } catch (err) {
            console.error('Error happened saving generated Composer workflow definition: ', err);
            setEncoded(downloadOpenWhiskComposerLink, 'OpenWhisk_Composer.zip', null);
        }

        try {
            const bpmnJson = bpmnModeler.get('canvas').getRootElement().businessObject.$parent;
            const btoc = new BpmnModelOrchestratorTransformation();

            setEncoded(
                downloadIBMComposerLink,
                'IBM_Composer.zip',
                await btoc.convertJsonToOrchestrator(bpmnJson, new ComposerGenerator(true), [new StrictModelValidator()])
            );
        } catch (err) {
            console.error('Error happened saving generated Composer workflow definition: ', err);
            setEncoded(downloadIBMComposerLink, 'IBM_Composer.zip', null);
        }

    }, 500);

    bpmnModeler.on('commandStack.changed', exportArtifacts);
});
