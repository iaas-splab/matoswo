import inherits from 'inherits';

import PropertiesActivator from 'bpmn-js-properties-panel/lib/PropertiesActivator';

// Require all properties you need from existing providers.
// In this case all available bpmn relevant properties without camunda extensions.
import processProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/ProcessProps';
import documentationProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/DocumentationProps';
import idProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/IdProps';
import nameProps from 'bpmn-js-properties-panel/lib/provider/bpmn/parts/NameProps';

// Require custom property entries.
import matoswoProps from './parts/MaToSWoProps';


// The general tab contains all bpmn relevant properties.
// The properties are organized in groups.
function createGeneralTabGroups(element, bpmnFactory, canvas, elementRegistry, translate) {
    var generalGroup = {
        id: 'general',
        label: 'General',
        entries: []
    };

    idProps(generalGroup, element, translate);
    nameProps(generalGroup, element, bpmnFactory, canvas, translate);
    processProps(generalGroup, element, translate);

    var documentationGroup = {
        id: 'documentation',
        label: 'Documentation',
        entries: []
    };

    documentationProps(documentationGroup, element, bpmnFactory, translate);

    return [
        generalGroup,
        documentationGroup
    ];
}

// Create the custom matoswo tab
function createMaToSWoTabGroups(element) {
    // Create a group called "MaToSWo Properties".
    var matoswoGroup = {
        id: 'matoswo-tab',
        label: 'MaToSWo Properties',
        entries: []
    };

    // Add the matoswo props to the matoswoGroup group.
    matoswoProps(matoswoGroup, element);

    return [
        matoswoGroup
    ];
}

export default function MaToSWoPropertiesProvider(eventBus, bpmnFactory, canvas, elementRegistry, translate) {
    PropertiesActivator.call(this, eventBus);

    this.getTabs = function (element) {

        var generalTab = {
            id: 'general',
            label: 'General',
            groups: createGeneralTabGroups(element, bpmnFactory, canvas, elementRegistry, translate)
        };

        // The "matoswo" tab
        var matoswoTab = {
            id: 'matoswo',
            label: 'MaToSWo',
            groups: createMaToSWoTabGroups(element)
        };

        // Show general + "matoswo" tab
        return [
            generalTab,
            matoswoTab
        ];
    };
}

inherits(MaToSWoPropertiesProvider, PropertiesActivator);