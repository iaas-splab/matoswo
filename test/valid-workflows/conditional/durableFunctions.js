const df = require("durable-functions")

module.exports = df.orchestrator(function* (context) {
    let result = context.df.getInput()
    while (result.counter < 5) {
        result = yield context.df.callActivity("IncreaseByOne", result)
    }
    if (result.value < 10) {
        result = yield context.df.callActivity("TaskLessThan10", result)
    } else if (result.value > 10) {
        result = yield context.df.callActivity("TaskGreaterThan10", result)
    } else { 
        result = yield context.df.callActivity("TaskElseIs10", result)
    }
    return result
})