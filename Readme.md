#  Modeling and Transformation of Serverless Workflows - Implementation
The Modeling and Transformation of Serverless Workflows (MaToSWo) prototype enables users to model serverless workflows using BPMN.
The serverless workflow models are then used to generate corresponding orchestrator-specific workflow definitions, making use of platform-specific serverless function orchestration constructs, for the supported serverless cloud platforms.
Currently, MaToSWo supports three orchestrators:
* Amazon Web Services, with Step Functions
* Microsoft Azure, with Durable Functions
* OpenWhisk, with Composer

MaToSWo makes the generated workflow definitions available for download as a zip archive, right beneath the modeling area of the user interface.

## Prerequisites and Setup
* NodeJS, tested with v12.19.0
* Clone this repository
* Navigate to the main folder, containing `package.json`
* Run `npm install`
* Run `npm run dev` to start a local development server at port `9013`, and serve the MaTosWo prototype
* To execute the tests, run `npm run test`

## License
The project license is [Apache License 2.0](LICENSE).

Initialization code for the [bpmn-js](https://github.com/bpmn-io/bpmn-js) library and the user interface is based on the code from the [properties-panel-extension](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel-extension) example project.
