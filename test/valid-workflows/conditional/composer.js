const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.while(params => params.counter < 5,
        composer.action('IncreaseByOne')
    ),
    composer.if(params => params.value < 10,
        composer.action('TaskLessThan10'),
        composer.if(params => params.value > 10,
            composer.action('TaskGreaterThan10'),
            composer.action('TaskElseIs10')
        )
    )
)