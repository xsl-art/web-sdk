import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, "packages");
const packageFiles = fs.readdirSync(packageDir);

function output(path) {
  return [
    {
      input: [`./packages/${path}/src/index.ts`],
      output: [
        {
          file: `./packages/${path}/dist/index.cjs.js`,
          format: "cjs",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.esm.js`,
          format: "esm",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.js`,
          format: "umd",
          name: "web-see",
          sourcemap: true,
        },
        {
          file: `./packages/${path}/dist/index.min.js`,
          format: "umd",
          name: "web-see",
          sourcemap: true,
          plugins: [terser()],
        },
      ],
      plugins: [
        resolve({
          extensions: [".ts", ".tsx", ".js", ".jsx"],
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
      input: `./packages/${path}/src/index.ts`,
      output: [
        { file: `./packages/${path}/dist/index.cjs.d.ts`, format: "cjs" },
        { file: `./packages/${path}/dist/index.esm.d.ts`, format: "esm" },
        { file: `./packages/${path}/dist/index.d.ts`, format: "umd" },
        { file: `./packages/${path}/dist/index.min.d.ts`, format: "umd" },
      ],
      plugins: [dts()],
    },
  ];
}

export default [...packageFiles.map(path => output(path)).flat()];
