process.env.NODE_ENV = 'test'
const babelConfig = JSON.parse(
  require('fs').readFileSync(require('path').join(__dirname, '.babelrc')),
)

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
