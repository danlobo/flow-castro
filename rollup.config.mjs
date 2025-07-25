import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import external from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import fs from "fs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import autoprefixer from "autoprefixer";

const packageJson = JSON.parse(fs.readFileSync("./package.json"));
const isProduction = process.env.NODE_ENV === "production";

const config = [
  {
    input: "src/index.js",
    output: [
      {
        dir: "dist/cjs",
        format: "cjs",
        sourcemap: !isProduction,
        name: "lib",
        //preserveModules: true
      },
      {
        dir: "dist/esm",
        format: "esm",
        sourcemap: !isProduction,
        //preserveModules: true
      },
    ],
    plugins: [
      peerDepsExternal(),
      external(),
      resolve({
        module: true,
        jsnext: true,
        browser: true,
        main: true,
      }),
      replace({
        preventAssignment: true,
        "process.env.NODE_ENV": JSON.stringify("dev"),
      }),
      babel({
        babelHelpers: "bundled",
        presets: [["@babel/preset-react", { runtime: "automatic" }]],
        plugins: ["@babel/plugin-proposal-nullish-coalescing-operator"],
        exclude: "node_modules/**",
        sourceMaps: true,
      }),
      commonjs(),

      postcss({
        sourceMap: !isProduction,
        autoModules: false,
        extract: true,
        inject: false,
        modules: true,

        plugins: [autoprefixer()],
      }),
      // isProduction &&
      //   terser({
      //     compress: {
      //       // Desabilitar otimizações específicas que podem causar problemas
      //       pure_getters: false,
      //       keep_fnames: true,
      //       keep_classnames: true,
      //     },
      //     mangle: {
      //       keep_fnames: true,
      //       keep_classnames: true,
      //     },
      //   }),
    ],
    external: ["react", "react-dom"],
  },
];

export default config;
