{
  "StartAt": "T1Activity_11yuyn8",
  "States": {
    "T1Activity_11yuyn8": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:T1",
      "TimeoutSeconds": 1, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 2,
          "BackoffRate": 1.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "Next": "ERTTTTActivity_1rugqx0"
        }
      ],
      "Next": "ifConditionGateway_0ea1v07"
    },
    "ERTTTTActivity_1rugqx0": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:ERTTTT",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "End": true
    },
    "ifConditionGateway_0ea1v07": {
      "Type": "Choice",
      "Choices": [
        {
          "Or": [
            {
              "And": [
                {
                  "Variable": "$.x",
                  "NumericEquals": 10
                },
                {
                  "Not" : {
                    "Variable": "$.y",
                    "StringEquals": "some string"
                  }
                }
              ]
            },
            {
              "Variable": "$.z",
              "BooleanEquals": true
            }
          ],
          "Next": "C2LoopActivity_1c92ap7"
        }
      ],
      "Default": "pGatewayGateway_1wwkbso"
    },
    "C2LoopActivity_1c92ap7": {
      "Type": "Choice",
      "Choices": [
        {
          "Or": [
            {
              "And": [
                {
                  "Variable": "$.x",
                  "NumericEquals": 10
                },
                {
                  "Not" : {
                    "Variable": "$.y",
                    "StringEquals": "some string"
                  }
                }
              ]
            },
            {
              "Variable": "$.z",
              "BooleanEquals": true
            }
          ],
          "Next": "C2Activity_1c92ap7"
        }
      ],
      "Default": "Event_0zx36p2"
    },
    "C2Activity_1c92ap7": {
      "Type": "Task",
      "Resource": "arn:aws:states:::states:startExecution.sync:2",
      "Parameters": {
        "StateMachineArn": "arn:aws:states:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:stateMachine:C2",
        "Input": {
          "NeedCallback": false,
          "AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID.$": "$$.Execution.Id",
          "value.$": "$.value"
        }
      },
      "OutputPath": "$.Output",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "Next": "Err1Activity_0wbof7i"
        }
      ],
      "Next": "C2LoopActivity_1c92ap7"
    },
    "Err1Activity_0wbof7i": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Err1",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "Next": "Event_0zx36p2"
    },
    "Event_0zx36p2": {
      "Type": "Wait",
      "Seconds": 1,
      "Next": "ETActivity_009ibgi"
    },
    "pGatewayGateway_1wwkbso": {
      "Type": "Parallel",
      "ResultPath": "$.value",
      "Branches": [
        {
          "StartAt": "PT1Activity_1jg009c",
          "States": {
            "PT1Activity_1jg009c": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:PT1",
              "TimeoutSeconds": 1, 
              "Retry": [
                {
                  "ErrorEquals": [ "States.ALL" ],
                  "MaxAttempts": 5,
                  "BackoffRate": 1.0
                }
              ],
              "End": true
            }
          }
        },
        {
          "StartAt": "PT2Activity_0jwp4n1",
          "States": {
            "PT2Activity_0jwp4n1": {
              "Type": "Task",
              "Resource": "arn:aws:states:::states:startExecution.sync:2",
              "Parameters": {
                "StateMachineArn": "arn:aws:states:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:stateMachine:PT2",
                "Input": {
                  "NeedCallback": false,
                  "AWS_STEP_FUNCTIONS_STARTED_BY_EXECUTION_ID.$": "$$.Execution.Id",
                  "value.$": "$.value"
                }
              },
              "OutputPath": "$.Output",
              "TimeoutSeconds": 300000, 
              "Retry": [
                {
                  "ErrorEquals": [ "States.ALL" ],
                  "MaxAttempts": 0
                }
              ],
              "End": true
            }
          }
        }
      ],
      "Next": "ETActivity_009ibgi"
    },
    "ETActivity_009ibgi": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:ET",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "Next": "gdfgdsfLoopActivity_1ytkbco"
        }
      ],
      "End": true
    },
    "gdfgdsfLoopActivity_1ytkbco": {
      "Type": "Choice",
      "Choices": [
        {
          "Or": [
            {
              "And": [
                {
                  "Variable": "$.x",
                  "NumericEquals": 10
                },
                {
                  "Not" : {
                    "Variable": "$.y",
                    "StringEquals": "some string"
                  }
                }
              ]
            },
            {
              "Variable": "$.z",
              "BooleanEquals": true
            }
          ],
          "Next": "gdfgdsfActivity_1ytkbco"
        }
      ],
      "Default": "EndgdfgdsfLoopActivity_1ytkbco"
    },
    "EndgdfgdsfLoopActivity_1ytkbco": {
        "Type": "Succeed"
    },
    "gdfgdsfActivity_1ytkbco": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:gdfgdsf",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "Next": "gdfgdsfLoopActivity_1ytkbco"
    }
  }
}