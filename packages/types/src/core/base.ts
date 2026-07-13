import { EVENT_TYPE, STATUS_CODE, USER_ACTION } from "@websdk/common";

//Without把T中不包含U的属性设置为可选
export type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

//T U 互斥至少有一个
export type XOR<T, U> = (Without<T, U> & U) | (Without<U, T> & T);

/**Http请求 */
export interface HttpData {
  type?: string;
  method?: string;
  time: number;
  url: string;
  elapsedTime: number; //接口时长
  message: string;
  Status?: number; //状态码
  status?: string;
  requestData?: {
    httpType: string; //请求类型 xhr fetch
    method: string; //请求方式
    data: any;
  };
  response?: {
    Status: number;
    data: any;
  };
}

/**资源加载失败*/
export interface ResourceError {
  time: number;
  message: string;
  name: string; //资源名称类型 js css
}

/**长任务列表 */
export interface LongTask {
  time: number;
  name: string; //长任务名称
  longTask: any; //长任务详情
}

/**性能指标 */
export interface PerformanceData {
  name: string; //指标名称
  value: number; //指标值
  rating: string; //指标等级
}

/**内存信息 */
export interface MemoryData {
  name: string;
  memory: {
    jsHeapSizeLimit: number; //js堆大小限制
    jsHeapSize: number; //js堆大小
    usedJSHeapSize: number; //已用js堆大小
  };
}

/**代码错误 */
export interface CodeError {
  column: number; //错误列号
  fileName: string; //错误文件名
  message: string; //错误信息
  line: number; //错误行号
}

/**用户行为 */
export interface Behavior {
  type: EVENT_TYPE;
  category: any;
  status: STATUS_CODE;
  time: number;
  data: XOR<HttpData, XOR<CodeError, RouteHistory>>;
  message: string;
  name?: string;
}

/**录屏信息 */
export interface RecordScreen {
  recordScreenId: string; //录屏id
  events: string; //录屏内容
}

/**上报的数据接口 */
export interface ReportData
  extends HttpData, ResourceError, LongTask, PerformanceData, MemoryData, CodeError, RecordScreen {
  type: string; //事件类型
  pageUrl: string; //当前页面url
  time: number; //事件时间戳
  uuid: string; //页面唯一标识
  apikey: string; //项目id
  status: string; //事件状态
  sdkVersion: string; //sdk版本号
  breadcrumb?: BreadcrumbData[]; //用户行为

  //设备信息
  deviceInfo: {
    browserVsersion: string | number;
    browser: string;
    osVersion: string | number; //电脑系统
    os: string; //设备系统
    ua: string; //设备详情
    device: string; //设备类型描述
    device_type: string; //设备类型 pc
  };
}

export interface Callback {
  (...args: any[]): void;
}

export interface IAnyObject {
  [key: string]: any;
}

export type voidFun = (...args: any[]) => void;

export interface ReplaceHandler {
  type: EVENT_TYPE;
  callback: Callback;
}

export type ReplaceCallback = (data: any) => void;

export interface ResourceTarget {
  src?: string;
  href?: string;
  localName?: string;
}

//通用信息
export interface AuthInfo {
  apikey: string; //项目id
  adkVersion: string; //adk版本号
  userId?: string;
}

export interface BreadcrumbData {
  type: EVENT_TYPE; //事件类型
  category: USER_ACTION; //用户行为
  status: STATUS_CODE;
  time: number;
  data: any;
}

export interface ErrorTarget {
  target?: {
    localName?: string;
  };
  error?: any;
  message?: string;
}

export interface RouteHistory {
  from: string;
  to: string;
}

export interface WebSdk {
  hasError: false; //某段时间代码是否报错
  events: string[]; //存储录屏的信息
  recordScreenId: string; //录屏id
  _loopTimer: number; //白屏循环检测的timer
  transportData: any; //上报的数据
  options: any; //配置信息
  replaceFlag: {
    //订阅信息
    [key: string]: any;
  };
  deviceInfo: {
    //设备信息
    [key: string]: any;
  };
}

//sdk插件核心core
export interface SdkBase {
  transportData: any; //上报的数据
  breadcrumb?: any; //用户行为
  options: any;
  notify: any; //发表消息
}

export interface Window {
  chrome: {
    app: {
      [key: string]: any;
    };
  };
  history: any;
  addEventListener: any;
  innerWidth: number;
  innerHeight: number;
  onpopstate: any;
  performance: any;
  __webSdk__: {
    [key: string]: any;
  };
}

export abstract class BasePlugin {
  public type: string; //插件类型
  constructor(type: string) {
    this.type = type;
  }
  abstract bindOptions(options: object): void; //校验参数
  abstract core(sdkBase: SdkBase): void; //核心逻辑
  abstract transform(data: any): void; //数据转化
}
