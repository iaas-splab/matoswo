const df = require("durable-functions")
const moment = require("moment")

module.exports = df.orchestrator(function* (context) {
    let result = context.df.getInput()
    try {
        let deadline = moment.utc(context.df.currentUtcDateTime).add(400, "ms")
        let timeoutTask = context.df.createTimer(deadline.toDate())
        result = context.df.callActivityWithRetry("T1", new df.RetryOptions(1000, 2), result)
        let winner = yield context.df.Task.any([result, timeoutTask])

        if (winner === result) {
            timeoutTask.cancel()
            result = result.result
        } else {
            throw new Error("Timeout occured")
        }
    } catch (error) {
        result = error
        result = yield context.df.callActivity("ERTTTT", result)
        return result
    }
    if (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
        while (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
            try {
                result = yield context.df.callSubOrchestrator("C2", result)
            } catch (error) {
                result = error
                result = yield context.df.callActivity("Err1", result)
            }
        }
        deadline = moment.utc(context.df.currentUtcDateTime).add(500, "ms")
        yield context.df.createTimer(deadline.toDate())
    } else { 
        let tasks = []
        tasks.push(context.df.callActivityWithRetry("PT1", new df.RetryOptions(1000, 5), result))
        tasks.push(context.df.callSubOrchestrator("PT2", result))
        result = yield context.df.Task.all(tasks)
    }
    try {
        result = yield context.df.callActivity("ET", result)
    } catch (error) {
        result = error
        while (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
            result = yield context.df.callActivity("gdfgdsf", result)
        }
        return result
    }
    return result
})