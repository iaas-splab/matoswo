const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.action('Task1'),
    composer.if(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
        composer.action('Task7'),
        composer.if(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
            composer.action('Task6'),
            composer.sequence(
                composer.action('Task2'),
                composer.parallel(
                    composer.action('Task3'),
                    composer.action('Task4')
                )
            )
        )
    ),
    composer.action('Task5')
)