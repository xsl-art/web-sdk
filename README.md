# @xyz-sdk

一个轻量级、模块化的前端监控 SDK，支持错误监控、性能监控和页面录屏功能。

## 特性

- **核心监控** (`@xyz-sdk/core`)：自动捕获 JS 错误、Promise 异常、资源加载失败、HTTP 请求异常等
- **性能监控** (`@xyz-sdk/performance`)：采集 FCP、LCP、FID、CLS 等 Web Vitals 指标及资源加载性能
- **录屏回放** (`@xyz-sdk/recordscreen`)：基于 rrweb 录制用户操作，支持错误发生时自动上报录屏数据
- **模块化设计**：按需引入，支持 Vue、React 等主流框架
- **丰富的配置项**：采样率、批量上报、错误聚合、离线缓存、限流控制等

## 安装

### npm/yarn/pnpm

```bash
# 基础监控（必选）
npm install @xyz-sdk/core

# 性能监控（可选）
npm install @xyz-sdk/performance

# 录屏功能（可选）
npm install @xyz-sdk/recordscreen
```

## 快速开始

### 基础使用（原生 JS）

```javascript
import { init } from "@xyz-sdk/core";
import WebPerformance from "@xyz-sdk/performance";
import RecordScreen from "@xyz-sdk/recordscreen";

init({
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  // 可选配置
  userId: "user-123", // 用户ID
  release: "1.0.0", // 版本号，用于 sourcemap
  sampleRate: 1, // 采样率 0-1
  batchReport: true, // 开启批量上报
  batchSize: 10, // 每10条上报一次
  offlineCache: true, // 开启离线缓存
  plugins: [
    new WebPerformance(),
    new RecordScreen({
      recordScreenDuration: 10, // 录屏时长（秒）
      recordScreenTypeList: ["error", "unhandledrejection"],
    }),
  ],
});
```

### Vue 项目集成

#### Vue 2

```javascript
import Vue from "vue";
import { init, install } from "@xyz-sdk/core";
import WebPerformance from "@xyz-sdk/performance";
import RecordScreen from "@xyz-sdk/recordscreen";

// 方式一：使用 install 方法（推荐）
Vue.use(install, {
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  plugins: [new WebPerformance(), new RecordScreen()],
});

// 方式二：在 main.js 中手动初始化
init({
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  plugins: [new WebPerformance(), new RecordScreen()],
});
```

#### Vue 3

```javascript
import { createApp } from "vue";
import { init } from "@xyz-sdk/core";
import WebPerformance from "@xyz-sdk/performance";
import RecordScreen from "@xyz-sdk/recordscreen";

const app = createApp(App);

init({
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  plugins: [new WebPerformance(), new RecordScreen()],
});

app.mount("#app");
```

### React 项目集成

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import { init, errorBoundary } from "@xyz-sdk/core";
import WebPerformance from "@xyz-sdk/performance";
import RecordScreen from "@xyz-sdk/recordscreen";

// 初始化监控
init({
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  plugins: [new WebPerformance(), new RecordScreen()],
});

// 方式一：错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 自动上报 React 错误
    errorBoundary(error);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// 方式二：函数组件 + hook
function App() {
  useEffect(() => {
    // 初始化已完成
  }, []);

  return <div>App</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
```

## 配置项

### 核心配置

| 参数       | 类型    | 必填 | 说明                        |
| ---------- | ------- | ---- | --------------------------- |
| `dsn`      | string  | 是   | 上报接口地址                |
| `apiKey`   | string  | 是   | 项目唯一标识                |
| `userId`   | string  | 否   | 用户ID                      |
| `release`  | string  | 否   | 版本号，用于 sourcemap 匹配 |
| `disabled` | boolean | 否   | 是否禁用 SDK                |

### 监控开关

| 参数                       | 类型    | 默认值 | 说明                       |
| -------------------------- | ------- | ------ | -------------------------- |
| `monitorError`             | boolean | true   | 监控 JS 错误               |
| `monitorUnhandleRejection` | boolean | true   | 监控 Promise 未处理异常    |
| `monitorXhr`               | boolean | true   | 监控 XHR 请求              |
| `monitorFetch`             | boolean | true   | 监控 Fetch 请求            |
| `monitorClick`             | boolean | true   | 监控点击事件               |
| `monitorHashChange`        | boolean | true   | 监控 hash 变化             |
| `monitorHistory`           | boolean | true   | 监控 history 变化          |
| `monitorWhiteScreen`       | boolean | false  | 监控白屏                   |
| `monitorRecordScreen`      | boolean | false  | 开启录屏（需引入录屏插件） |

### 上报控制

| 参数                 | 类型    | 默认值 | 说明                 |
| -------------------- | ------- | ------ | -------------------- |
| `sampleRate`         | number  | 1      | 全局采样率 0-1       |
| `sampleRateByType`   | object  | {}     | 按事件类型配置采样率 |
| `rateLimitPerMinute` | number  | 0      | 每分钟最大上报条数   |
| `batchReport`        | boolean | false  | 开启批量上报         |
| `batchSize`          | number  | 10     | 批量上报条数         |
| `batchInterval`      | number  | 5000   | 批量上报间隔(ms)     |
| `aggregateErrors`    | boolean | false  | 开启错误聚合         |
| `aggregateInterval`  | number  | 10000  | 错误聚合周期(ms)     |
| `useImgUpload`       | boolean | false  | 使用图片方式上报     |

### 离线缓存

| 参数                     | 类型    | 默认值 | 说明             |
| ------------------------ | ------- | ------ | ---------------- |
| `offlineCache`           | boolean | false  | 开启离线缓存     |
| `offlineCacheMaxSize`    | number  | -      | 缓存最大条数     |
| `offlineCacheExpireTime` | number  | -      | 缓存过期时间(ms) |
| `offlineRetryDelay`      | number  | -      | 重试间隔(ms)     |

### 录屏配置

| 参数                   | 类型     | 默认值                                                      | 说明               |
| ---------------------- | -------- | ----------------------------------------------------------- | ------------------ |
| `recordScreenDuration` | number   | 10                                                          | 单次录屏时长(秒)   |
| `recordScreenTypeList` | string[] | ['error', 'unhandledrejection', 'resource', 'fetch', 'xhr'] | 触发录屏的事件类型 |

### 其他配置

| 参数                 | 类型     | 说明                |
| -------------------- | -------- | ------------------- |
| `maxBreadcrumbs`     | number   | 用户行为最大记录数  |
| `throttleDelayTime`  | number   | 节流时间间隔        |
| `overTime`           | number   | 超时时间            |
| `repeatCodeError`    | boolean  | 是否去除重复错误    |
| `skeletonProject`    | boolean  | 是否有骨架屏        |
| `whiteBoxElements`   | string[] | 白屏检测元素列表    |
| `filterXhrUrlRegExp` | string[] | 过滤的 XHR URL 正则 |

## 高级用法

### 自定义上报前处理

```javascript
init({
  dsn: "https://your-server.com/report",
  apiKey: "your-project-id",
  beforeDataReport: async data => {
    // 修改上报数据
    data.customField = "customValue";
    return data;
    // 返回 false 则不上报
  },
  beforePushBreadcrumb: data => {
    // 过滤用户行为
    if (data.type === "click") {
      return data;
    }
    return data;
  },
});
```

### 手动上报

```javascript
import { log, transportData } from "@xyz-sdk/core";

// 自定义日志
log({
  type: "custom",
  message: "自定义错误信息",
  tag: "业务标签",
});

// 直接发送数据
transportData.send({
  type: "custom",
  status: "error",
  message: "手动上报的数据",
});
```

### 动态修改配置

```javascript
import { options } from "@xyz-sdk/core";

// 动态关闭监控
options.disabled = true;

// 动态修改用户ID
options.userId = "new-user-id";
```

## 数据格式

### 错误上报数据

```json
{
  "type": "error",
  "status": "error",
  "time": 1690000000000,
  "message": "Cannot read properties of undefined",
  "name": "TypeError",
  "url": "https://example.com/page",
  "line": 10,
  "column": 20,
  "stack": "TypeError: ...",
  "errorUid": "error-unique-id"
}
```

### 性能数据

```json
{
  "type": "performance",
  "name": "LCP",
  "rating": "good",
  "value": 1200,
  "time": 1690000000000
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

ISC
