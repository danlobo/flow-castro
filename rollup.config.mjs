import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import external from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import dts from "rollup-plugin-dts";
import jsx from 'rollup-plugin-jsx'
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import fs from 'fs';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace'
import scss from 'rollup-plugin-scss'

const packageJson = JSON.parse(fs.readFileSync('./package.json'));

const config = [
  {
    input: 'src/index.js',
    preserveModules: true,
    output: [
      {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
        name: 'lib'
      },
      {
        dir: 'dist/esm',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      peerDepsExternal(),
      external(),
      resolve({ 
        module: true,
        jsnext: true,
        browser: true,
        main: true
      }),
      replace({preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('dev')
      }),
      scss({
        include: ['src/**/*.css'],
        fileName: 'index.css',
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        presets: [[
          '@babel/env',
          {
            modules: false,
            targets: {
              esmodules: true,
            },
          },
        ],
        [
          "@babel/preset-react", {"runtime": "automatic"}
        ]],
        plugins: ["@babel/plugin-proposal-nullish-coalescing-operator"],
        exclude: "node_modules/**"
      }),
      // jsx( {factory: 'React.createElement'} ),
      // typescript({ tsconfig: './tsconfig.json' }),
      // postcss({
      //   extract: 'index.css',
      //   modules: true,
      //   namedExports: true,
      //   include: ['src/**/*.css'],
      // }),
      //terser(),
      // serve({
      //   // open: true,
      //   verbose: true,
      //   contentBase: ['dev', 'dist'],
      //   host: "localhost",
      //   port: 3200,
      // }),
      // livereload({ watch: "dist" }),
    ],
    external: ["react", "react-dom"],
  },
  // {
  //   input: 'dist/esm/types/index.d.ts',
  //   output: [{ file: 'dist/index.d.ts', format: "esm" }],
  //   external: [/\.css$/],
  //   plugins: [dts()],
  // }
]

export default config;