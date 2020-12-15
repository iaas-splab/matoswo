const composer = require('openwhisk-composer')

module.exports = composer.action('asfasf', { limits: { timeout: 300000 } })