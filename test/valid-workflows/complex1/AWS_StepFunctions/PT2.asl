{
  "StartAt": "PT2T1FanoutActivity_12l6xl4",
  "States": {
    "PT2T1FanoutActivity_12l6xl4": {
      "Type": "Map",
      "ItemsPath": "$.value",
      "ResultPath": "$.value",
      "Iterator": {
        "StartAt": "PT2T1Activity_12l6xl4",
        "States": {
          "PT2T1Activity_12l6xl4": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:PT2T1",
            "TimeoutSeconds": 300000, 
            "End": true
          }
        }
      },
      "Next": "P2T2LoopActivity_1xkrzwy"
    },
    "P2T2LoopActivity_1xkrzwy": {
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
          "Next": "P2T2Activity_1xkrzwy"
        }
      ],
      "Default": "EndP2T2LoopActivity_1xkrzwy"
    },
    "EndP2T2LoopActivity_1xkrzwy": {
        "Type": "Succeed"
    },
    "P2T2Activity_1xkrzwy": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:P2T2",
      "TimeoutSeconds": 300000, 
      "Catch": [
        {
          "ErrorEquals": [ "States.ALL" ],
          "Next": "tttttttttActivity_1gpx43q"
        }
      ],
      "Next": "P2T2LoopActivity_1xkrzwy"
    },
    "tttttttttActivity_1gpx43q": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:ttttttttt",
      "TimeoutSeconds": 300000, 
      "Next": "ErrortttttttttActivity_1gpx43q"
    },
    "ErrortttttttttActivity_1gpx43q": {
      "Type": "Fail"
    }
  }
}