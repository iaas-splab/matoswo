{
  "StartAt": "Task1Activity_1p25ude",
  "States": {
    "Task1Activity_1p25ude": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task1",
      "TimeoutSeconds": 300000, 
      "Next": "Gateway_176tnp7"
    },
    "Gateway_176tnp7": {
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
          "Next": "Task7Activity_0pr33hu"
        }
      ],
      "Default": "Gateway_0ofnafm"
    },
    "Task7Activity_0pr33hu": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task7",
      "TimeoutSeconds": 300000, 
      "Next": "Task5Activity_1brsihq"
    },
    "Gateway_0ofnafm": {
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
          "Next": "Task6Activity_1xgcmdd"
        }
      ],
      "Default": "Task2Activity_0x31p4i"
    },
    "Task6Activity_1xgcmdd": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task6",
      "TimeoutSeconds": 300000, 
      "Next": "Task5Activity_1brsihq"
    },
    "Task2Activity_0x31p4i": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task2",
      "TimeoutSeconds": 300000, 
      "Next": "Gateway_0us6aju"
    },
    "Gateway_0us6aju": {
      "Type": "Parallel",
      "ResultPath": "$.value",
      "Branches": [
        {
          "StartAt": "Task3Activity_0mqfpit",
          "States": {
            "Task3Activity_0mqfpit": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task3",
              "TimeoutSeconds": 300000, 
              "End": true
            }
          }
        },
        {
          "StartAt": "Task4Activity_1u6vn8o",
          "States": {
            "Task4Activity_1u6vn8o": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task4",
              "TimeoutSeconds": 300000, 
              "End": true
            }
          }
        }
      ],
      "Next": "Task5Activity_1brsihq"
    },
    "Task5Activity_1brsihq": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:Task5",
      "TimeoutSeconds": 300000, 
      "End": true
    }
  }
}