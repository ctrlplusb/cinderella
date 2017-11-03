const fs = require('fs')
const path = require('path')

process.env.NODE_ENV = 'test'

const babelConfigContents = fs.readFileSync(path.join(__dirname, '.babelrc'))
const babelConfig = JSON.parse(babelConfigContents)

module.exports = wallaby => ({
  files: ['src/**/*.js', { pattern: 'src/**/*.test.js', ignore: true }],
  tests: ['src/**/*.test.js'],
  testFramework: 'jest',
  env: {
    type: 'node',
    runner: 'node', // '/Users/sean/.nvm/versions/node/v6.9.4/bin/node',
  },
  compilers: {
    'src/**/*.js': wallaby.compilers.babel(babelConfig),
  },
})
