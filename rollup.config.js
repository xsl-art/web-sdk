import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import alias from "@rollup/plugin-alias";
import dts from "rollup-plugin-dts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 只发布这三个主包，每个包完全独立（内联所有依赖）
const mainPackages = ["core", "performance", "recordscreen"];

function output(pathname) {
  return [
    {
      input: [`./packages/${pathname}/src/index.ts`],
      // 所有依赖都内联打包，不设置 external
      output: [
        {
          file: `./packages/${pathname}/dist/index.cjs.js`,
          format: "cjs",
          sourcemap: true,
        },
        {
          file: `./packages/${pathname}/dist/index.esm.js`,
          format: "esm",
          sourcemap: true,
        },
        {
          file: `./packages/${pathname}/dist/index.js`,
          format: "umd",
          name: "xyz-sdk",
          sourcemap: true,
        },
        {
          file: `./packages/${pathname}/dist/index.min.js`,
          format: "umd",
          name: "xyz-sdk",
          sourcemap: true,
          plugins: [terser()],
        },
      ],
      plugins: [
        alias({
          entries: [
            {
              find: /^@xyz-sdk\/(.+)$/,
              replacement: path.resolve(__dirname, "packages/$1/src"),
            },
          ],
        }),
        resolve({
          extensions: [".ts", ".tsx", ".js", ".jsx"],
          preferBuiltins: false,
        }),
        commonjs(),
        json(),
        typescript({
          tsconfig: "./tsconfig.json",
          compilerOptions: {
            module: "ESNext",
            declaration: false,
          },
        }),
      ],
    },
    {
      input: `./packages/${pathname}/src/index.ts`,
      output: [
        { file: `./packages/${pathname}/dist/index.cjs.d.ts`, format: "cjs" },
        { file: `./packages/${pathname}/dist/index.esm.d.ts`, format: "esm" },
        { file: `./packages/${pathname}/dist/index.d.ts`, format: "umd" },
        { file: `./packages/${pathname}/dist/index.min.d.ts`, format: "umd" },
      ],
      plugins: [
        alias({
          entries: [
            {
              find: /^@xyz-sdk\/(.+)$/,
              replacement: path.resolve(__dirname, "packages/$1/src"),
            },
          ],
        }),
        resolve({
          extensions: [".ts", ".tsx", ".js", ".jsx"],
          preferBuiltins: false,
        }),
        dts(),
      ],
    },
  ];
}

export default [...mainPackages.map(pathname => output(pathname)).flat()];
