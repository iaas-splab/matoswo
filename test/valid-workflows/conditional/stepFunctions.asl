{
  "StartAt": "IncreaseByOneLoopActivity_0cwbo8z",
  "States": {
    "IncreaseByOneLoopActivity_0cwbo8z": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.counter",
          "NumericLessThan": 5,
          "Next": "IncreaseByOneActivity_0cwbo8z"
        }
      ],
      "Default": "Gateway_1aqgrku"
    },
    "IncreaseByOneActivity_0cwbo8z": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:IncreaseByOne",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "Next": "IncreaseByOneLoopActivity_0cwbo8z"
    },
    "Gateway_1aqgrku": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.value",
          "NumericLessThan": 10,
          "Next": "TaskLessThan10Activity_1ip7n8j"
        },
        {
          "Variable": "$.value",
          "NumericGreaterThan": 10,
          "Next": "TaskGreaterThan10Activity_13oiqvl"
        }
      ],
      "Default": "TaskElseIs10Activity_0aqlglq"
    },
    "TaskLessThan10Activity_1ip7n8j": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:TaskLessThan10",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "End": true
    },
    "TaskGreaterThan10Activity_13oiqvl": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:TaskGreaterThan10",
      "TimeoutSeconds": 300000, 
      "Retry": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "MaxAttempts": 0
        }
      ],
      "End": true
    },
    "TaskElseIs10Activity_0aqlglq": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:TaskElseIs10",
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