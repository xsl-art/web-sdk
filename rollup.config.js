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

// 只发布这三个主包，每个包完全独立（内联所有 @xyz-sdk/* 依赖）
const mainPackages = ["core", "performance", "recordscreen"];

// 第三方依赖（这些不会被打包进去）
// 注意：如果某个依赖需要被打包进去，请从这里移除
const externalDeps = [
  "error-stack-parser",
  "rrweb",
  "pako",
  "js-base64",
  "web-vitals",
  // "ua-parser-js",  // 已内联打包
];

function output(pathname) {
  return [
    {
      input: [`./packages/${pathname}/src/index.ts`],
      // 只排除第三方依赖，@xyz-sdk/* 会被内联打包
      external: externalDeps,
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
          // UMD 格式需要处理第三方依赖的全局变量
          globals: {
            "error-stack-parser": "ErrorStackParser",
            rrweb: "rrweb",
            pako: "pako",
            "js-base64": "Base64",
            "web-vitals": "webVitals",
            "ua-parser-js": "UAParser",
          },
        },
        {
          file: `./packages/${pathname}/dist/index.min.js`,
          format: "umd",
          name: "xyz-sdk",
          sourcemap: true,
          plugins: [terser()],
          globals: {
            "error-stack-parser": "ErrorStackParser",
            rrweb: "rrweb",
            pako: "pako",
            "js-base64": "Base64",
            "web-vitals": "webVitals",
            "ua-parser-js": "UAParser",
          },
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
      external: externalDeps,
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
        dts(),
      ],
    },
  ];
}

export default [...mainPackages.map(pathname => output(pathname)).flat()];
