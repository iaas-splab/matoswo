const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.try(
        composer.retry(2, composer.action('T1', { limits: { timeout: 400 } })),
        composer.action('ERTTTT')
    ),
    composer.if(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
        composer.sequence(
            composer.while(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
                composer.try(
                    composer.action('C2'),
                    composer.action('Err1')
                )
            ),
            composer.function(function(input) { const date = Date.now(); let now = null; do { now = Date.now(); } while (now - date < 500); return input; })
        ),
        composer.parallel(
            composer.retry(5, composer.action('PT1', { limits: { timeout: 1000 } })),
            composer.action('PT2')
        )
    ),
    composer.try(
        composer.action('ET'),
        composer.while(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
            composer.action('gdfgdsf')
        )
    )
)