const { uglify } = require('rollup-plugin-uglify')

const baseConfig = require('./rollup.config.js')

baseConfig.plugins.push(uglify())
baseConfig.output.file = 'dist/cinderella.min.js'

module.exports = baseConfig
