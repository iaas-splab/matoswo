const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.action('Task1', { limits: { timeout: 300000 } }),
    composer.if(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
        composer.action('Task7', { limits: { timeout: 300000 } }),
        composer.if(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
            composer.action('Task6', { limits: { timeout: 300000 } }),
            composer.sequence(
                composer.action('Task2', { limits: { timeout: 300000 } }),
                composer.parallel(
                    composer.action('Task3', { limits: { timeout: 300000 } }),
                    composer.action('Task4', { limits: { timeout: 300000 } })
                )
            )
        )
    ),
    composer.action('Task5', { limits: { timeout: 300000 } })
)