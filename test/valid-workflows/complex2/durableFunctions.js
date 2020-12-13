const df = require("durable-functions")

module.exports = df.orchestrator(function* (context) {
    let result = context.df.getInput()
    result = yield context.df.callActivity("Task1", result)
    if (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
        result = yield context.df.callActivity("Task7", result)
    } else { 
        if (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
            result = yield context.df.callActivity("Task6", result)
        } else { 
            result = yield context.df.callActivity("Task2", result)
            let tasks = []
            tasks.push(context.df.callActivity("Task3", result))
            tasks.push(context.df.callActivity("Task4", result))
            result = yield context.df.Task.all(tasks)
        }
    }
    result = yield context.df.callActivity("Task5", result)
    return result
})