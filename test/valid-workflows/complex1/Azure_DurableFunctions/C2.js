const df = require("durable-functions")
const moment = require("moment")

module.exports = df.orchestrator(function* (context) {
    let result = context.df.getInput()
    result = yield context.df.callActivity("asfasf", result)
    return result
})