const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.while(params => params.counter < 5,
        composer.action('IncreaseByOne', { limits: { timeout: 300000 } })
    ),
    composer.if(params => params.value < 10,
        composer.action('TaskLessThan10', { limits: { timeout: 300000 } }),
        composer.if(params => params.value > 10,
            composer.action('TaskGreaterThan10', { limits: { timeout: 300000 } }),
            composer.action('TaskElseIs10', { limits: { timeout: 300000 } })
        )
    )
)