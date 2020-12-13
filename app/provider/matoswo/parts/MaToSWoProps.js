import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';

import {is} from 'bpmn-js/lib/util/ModelUtil';
import {isOpening} from '../../../orchestrator-generation/util/util';


export default function(group, element) {

  // add matoswo entries to the properties panel

  if (is(element, 'bpmn:Process')) {
    group.entries.push(entryFactory.textField({
      id : 'awsAccountId',
      description : 'Specify the AWS Account Id',
      label : 'AWS Account Id',
      modelProperty : 'awsAccountId'
    }));

    group.entries.push(entryFactory.textField({
      id : 'awsAccountRegion',
      description : 'Specify the AWS Account Region',
      label : 'AWS Account Region',
      modelProperty : 'awsAccountRegion'
    }));
  }

  if (is(element, 'bpmn:Task') || is(element, 'bpmn:SubProcess')) {
    if (element.businessObject.loopCharacteristics && element.businessObject.loopCharacteristics.$type === 'bpmn:StandardLoopCharacteristics') {
      group.entries.push(entryFactory.textBox({
        id : 'loopCondition',
        description : 'Specify the loop condition',
        label : 'Loop Condition',
        modelProperty : 'loopCondition'
      }));
    }

    group.entries.push(entryFactory.textField({
      id : 'retryCount',
      description : 'Specify the number of retries',
      label : 'Retry Count',
      modelProperty : 'retryCount'
    }));

    group.entries.push(entryFactory.textField({
      id : 'timeoutMilliseconds',
      description : 'Specify the timeout in milliseconds',
      label : 'Timeout Milliseconds',
      modelProperty : 'timeoutMilliseconds'
    }));
  }

  if (is(element, 'bpmn:IntermediateCatchEvent')) {
    if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length  > 0 && element.businessObject.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition') {
      group.entries.push(entryFactory.textField({
        id : 'milliseconds',
        description : 'Specify the timer duration in milliseconds',
        label : 'Time Duration',
        modelProperty : 'milliseconds'
      }));
    }
  }

  if (is(element, 'bpmn:ExclusiveGateway')) {
    if (element.businessObject.incoming && element.businessObject.incoming.length === 1 && element.businessObject.outgoing && element.businessObject.outgoing.length > 1) {
      group.entries.push(entryFactory.textBox({
        id : 'branches',
        description : 'Specify a mapping of conditional branches',
        label : 'Branches Mapping',
        modelProperty : 'branches'
      }));
    }
  }

  if (is(element, 'bpmn:ExclusiveGateway') || is(element, 'bpmn:ParallelGateway')) {
    if (isOpening(element)) {
      group.entries.push(entryFactory.textBox({
        id : 'inputSchema',
        description : 'Specify an input schema',
        label : 'Input Schema',
        modelProperty : 'inputSchema'
      }));
    } else {
      group.entries.push(entryFactory.textBox({
        id : 'outputSchema',
        description : 'Specify an output schema',
        label : 'Output Schema',
        modelProperty : 'outputSchema'
      }));
    }
  }

  if (is(element, 'bpmn:IntermediateCatchEvent')) {
    group.entries.push(entryFactory.textBox({
      id : 'inputSchema',
      description : 'Specify an input schema',
      label : 'Input Schema',
      modelProperty : 'inputSchema'
    }));
  }

  if (is(element, 'bpmn:Task') || is(element, 'bpmn:SubProcess')) {
    group.entries.push(entryFactory.textBox({
      id : 'inputSchema',
      description : 'Specify an input schema',
      label : 'Input Schema',
      modelProperty : 'inputSchema'
    }));

    group.entries.push(entryFactory.textBox({
      id : 'outputSchema',
      description : 'Specify an output schema',
      label : 'Output Schema',
      modelProperty : 'outputSchema'
    }));
  }
}