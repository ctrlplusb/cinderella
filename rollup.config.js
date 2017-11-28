const flow = require('rollup-plugin-flow')
const babel = require('rollup-plugin-babel')

process.env.BABEL_ENV = 'production'

module.exports = {
  input: 'src/index.js',
  name: 'cinderella',
  output: {
    file: 'dist/cinderella.js',
    format: 'umd',
  },
  plugins: [
    flow({ all: true }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [['env', { modules: false }], 'stage-3', 'react'],
      plugins: ['external-helpers'],
    }),
  ],
  sourcemap: true,
}
