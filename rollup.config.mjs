import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss'
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // prepare runs this build during consumer installs; rollup treats unresolved
  // imports and missing exports as warnings (exit 0), which would ship a broken
  // bundle in a clean-looking install. Promote them to hard failures.
  onwarn(warning, warn) {
    if (warning.code === 'UNRESOLVED_IMPORT' || warning.code === 'MISSING_EXPORT') {
      throw new Error(`${warning.code}: ${warning.message}`)
    }
    warn(warning)
  },
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react'],
      extensions: ['.js', '.jsx'],
    }),
    commonjs(),
    postcss({
      extract: 'style.css',
      minimize: true,
    }),
    copy({
      targets: [
        { src: 'assets/fonts/*', dest: 'dist/fonts' },
      ],
    }),
  ],
}
