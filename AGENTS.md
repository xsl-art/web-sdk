# AGENTS.md

本文档面向后续参与本仓库的 AI Agent 或开发者，用于快速理解项目结构、开发约定和安全边界。

## 项目概览

本项目是一个前端监控 SDK，采用 pnpm workspace 管理多包。SDK 主要用于采集并上报前端错误、接口异常、用户行为、路由变化、资源加载异常、性能指标、白屏检测和录屏数据。

构建系统使用 Rollup。根目录的 `rollup.config.js` 会遍历 `packages/*`，为每个包从 `src/index.ts` 生成以下产物：

- CommonJS: `dist/index.cjs.js`
- ESM: `dist/index.esm.js`
- UMD: `dist/index.js`
- 压缩 UMD: `dist/index.min.js`
- 对应的 `.d.ts` 类型声明

TypeScript 开启严格模式，路径别名为 `@websdk/* -> ./packages/*/src`。

## 包职责

- `packages/common`
  - SDK 名称、版本和通用枚举常量。
  - 典型内容：`SDK_NAME`、`SDK_VERSION`、`EVENT_TYPE`、`STATUS_CODE`、`USER_ACTION`。

- `packages/types`
  - 全局类型、配置项、上报数据结构和插件抽象。
  - 典型内容：`InitOptions`、`ReportData`、`BreadcrumbData`、`BasePlugin`、`SdkBase`。

- `packages/utils`
  - 浏览器环境、全局状态、类型校验、AOP 重写、队列、URL、错误指纹和设备信息等工具函数。
  - 核心包和插件包都依赖这里的工具能力。

- `packages/core`
  - SDK 主入口和基础监控能力。
  - `src/index.ts` 暴露默认对象，包含 `init`、`install`、`errorBoundary`、`use`、`log`、`SDK_VERSION`、`SDK_NAME`。
  - `init(options)` 校验 `dsn` 和 `apiKey`，绑定配置，然后通过 `setupReplace()` 注册监控。
  - `replace.ts` 负责重写或监听 XHR、fetch、error、unhandledrejection、history、hashchange、click、whiteScreen。
  - `handleEvents.ts` 将事件转换成行为栈或上报数据。
  - `reportData.ts` 统一补充公共字段并使用 `sendBeacon`、图片请求或 fetch 上报。
  - `breadcrumb.ts` 维护用户行为栈。

- `packages/performance`
  - 性能监控插件，继承 `BasePlugin`。
  - 采集 Web Vitals、首屏时间、长任务、资源列表和内存信息。
  - 使用方式应通过 `core.use(WebPerformance, options)` 接入。

- `packages/recordscreen`
  - 录屏插件，基于 `rrweb` 采集事件，使用 `pako` + `js-base64` 压缩编码。
  - 当 `_support.hasError` 被核心上报逻辑标记后，会把对应时间片的录屏数据作为 `EVENT_TYPE.RECORDSCREEN` 上报。

## 关键运行链路

1. 使用方调用 `webSdk.init(options)`。
2. `handleOptions(options)` 将配置分别绑定到行为栈、上报器和全局 options。
3. `setupReplace()` 根据配置注册对应监控项。
4. `replace.ts` 通过 AOP 或事件监听捕获浏览器行为。
5. `notify(type, data)` 分发给订阅者。
6. `HandleEvents` 转换事件数据，写入 breadcrumb 或调用 `transportData.send()`。
7. `TransportData` 补充 `apiKey`、`sdkVersion`、`uuid`、`pageUrl`、`deviceInfo`、`breadcrumb` 等公共字段后上报到 `dsn`。

## 常用命令

- 安装依赖：`pnpm install`
- 构建全部包：`pnpm build`
- 自动修复 lint：`pnpm lint`
- 创建 changeset：`pnpm changeset`
- 更新包版本：`pnpm version-packages`
- 发布：`pnpm publish`

当前仓库未发现专门的测试脚本。做功能改动后，至少运行 `pnpm build` 和 `pnpm lint`。

## 开发约定

- 优先修改各包的 `src` 目录，不要直接编辑 `dist` 产物。
- 不要修改 `packages/*/node_modules` 下的文件；这些是依赖安装产物或 workspace 链接副本。
- 公共枚举和常量放在 `packages/common`。
- 公共类型放在 `packages/types`。
- 可复用工具函数放在 `packages/utils`。
- SDK 基础采集和上报链路放在 `packages/core`。
- 新增可插拔能力时，优先按 `BasePlugin` 插件模式实现，并通过 `core.use()` 接入。
- 保持 `@websdk/*` workspace 依赖和路径别名，不要引入跨包相对路径。
- 上报数据结构变化时，同步更新 `packages/types/src` 中对应类型。
- 监控开关或用户配置变化时，同步检查 `InitOptions`、`Options.bindOptions()` 和相关插件的默认值。

## 编码注意事项

- 本项目 TypeScript 配置较严格，新增代码应避免未使用变量、隐式 any、无返回值路径等问题。
- 部分源码注释或 `package.json` 描述在当前环境中显示为乱码，修改时请确认真实编码，避免无关的大范围格式化或重写。
- 现有代码中存在全局单例 `_support`，新增状态前先检查是否应该挂载在 `_support`，避免多次初始化产生重复监听。
- 重写浏览器原生 API 时，务必保留原方法行为，并避免捕获 SDK 自己的上报请求。
- 上报前 hook `beforeDataReport` 允许返回 `false` 中止上报，修改上报逻辑时要保留该行为。
- breadcrumb 默认会按时间排序，修改行为栈时注意最大长度和用户 hook `beforePushBreadcrumb`。
- 录屏、性能、白屏等数据通常不需要附带 breadcrumb，相关排除逻辑在 `TransportData.getTransportData()` 中。

## Git 与产物边界

- `dist` 是构建产物，除非任务明确要求更新发布产物，否则只改源码。
- `node_modules` 不应提交。
- 当前工作区可能有用户未提交改动。Agent 不应还原、覆盖或格式化与任务无关的文件。
- 若需要提交，先确认变更范围，只 stage 本次任务相关文件。

## 推荐检查清单

改动完成后按风险选择检查：

- 纯文档改动：确认 Markdown 内容可读即可。
- 类型或工具函数改动：运行 `pnpm build`。
- 核心采集、上报、插件逻辑改动：运行 `pnpm build` 和 `pnpm lint`，并尽量在浏览器环境手动验证初始化、事件采集和上报。
- 发布相关改动：确认 `changeset`、包版本、构建产物和 `publishConfig`。

