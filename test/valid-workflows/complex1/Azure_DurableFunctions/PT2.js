const df = require("durable-functions")
const moment = require("moment")

module.exports = df.orchestrator(function* (context) {
    let result = context.df.getInput()
    tasks = []
    for (let item of result.value) {
        tasks.push(context.df.callActivity("PT2T1", item))
    }
    result = yield context.df.Task.all(tasks)
    while (((result.x === 10 && !(result.y === "some string")) || result.z === true)) {
        try {
            result = yield context.df.callActivity("P2T2", result)
        } catch (error) {
            result = error
            result = yield context.df.callActivity("ttttttttt", result)
            throw error
        }
    }
    return result
})