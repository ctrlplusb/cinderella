const flow = require('rollup-plugin-flow')
const babel = require('rollup-plugin-babel')

process.env.BABEL_ENV = 'production'

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/cinderella.js',
    format: 'umd',
    sourcemap: true,
    name: 'cinderella',
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
}
