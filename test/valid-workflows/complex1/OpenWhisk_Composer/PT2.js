const composer = require('openwhisk-composer')

module.exports = composer.sequence(
    composer.map(
        composer.action('PT2T1')
    ),
    composer.while(params => ((params.x === 10 && !(params.y === "some string")) || params.z === true),
        composer.try(
            composer.action('P2T2'),
            composer.action('ttttttttt')
        )
    )
)