{
  "StartAt": "asfasfActivity_17ul5sn",
  "States": {
    "asfasfActivity_17ul5sn": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ACCOUNT_REGION_HERE:ACCOUNT_ID_HERE:function:asfasf",
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