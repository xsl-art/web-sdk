import { ReportData, BreadcrumbData } from "./base";

export interface InitOptions {
  dsn: string; //上报地址
  apiKey: string; //项目id
  release?: string; //业务构建版本，用于 sourcemap 匹配
  userId?: string; //用户id
  disabled?: boolean; //是否禁用sdk
  monitorXhr?: boolean; //是否监控xhr请求
  monitorFetch?: boolean; //是否监控fetch请求
  monitorClick?: boolean; //是否监控点击事件
  monitorError?: boolean; //是否监控错误事件
  monitorUnhandleRejection?: boolean; //是否监控未处理的拒绝事件
  monitorHashChange?: boolean; //是否监控hashChange事件
  monitorHistory?: boolean; //是否监控history事件
  monitorPerformance?: boolean; //是否监控performance事件
  monitorRecordScreen?: boolean; //是否开启录屏
  recordScreenDuration?: number; //单次录屏时长
  recordScreenTypeList?: string[]; //上报录屏的错误列表
  monitorWhiteScreen?: boolean; //是否监控白屏事件
  skeletonProject?: boolean; // 白屏检测的项目是否有骨架屏
  whiteBoxElements?: string[]; // 白屏检测的元素列表
  filterXhrUrlRegExp?: string[]; // 过滤的xhr请求正则表达式
  useImgUpload?: boolean; // 是否使用图片上传错误信息
  offlineCache?: boolean; // 是否开启离线缓存
  offlineCacheMaxSize?: number; // 离线缓存最大条数
  offlineCacheExpireTime?: number; // 离线缓存过期时间
  offlineRetryDelay?: number; // 离线数据重试间隔
  throttleDelayTime?: number; // 节流时间间隔
  overTime?: number; // 超时时间
  maxBreadcrumbs?: number; // 存放用户行为最大长度
  beforePushBreadcrumb?(data: BreadcrumbData): BreadcrumbData; // 添加到行为列表前的 hook
  beforeDataReport?(data: ReportData): Promise<ReportData | boolean>; // 上报前的 hook
  getUserId?: () => string | number;
  handleHttpStatus?: (data: any) => boolean; // 处理接口返回的 response
  repeatCodeError?: boolean; // 是否去除重复的代码错误，重复的错误只上报一次
  sampleRate?: number; // 全局采样率 0-1，默认 1（全量上报）
  sampleRateByType?: { [eventType: string]: number }; // 按事件类型配置的采样率，优先级高于 sampleRate
  rateLimitPerMinute?: number; // 每分钟最大上报条数（令牌桶限流），0 或缺省表示不限制
  aggregateErrors?: boolean; // 是否开启错误指纹聚合，同一 errorUid 的重复错误折叠为一条并按周期补报次数
  aggregateInterval?: number; // 错误聚合补报周期，默认 10000ms
  batchReport?: boolean; // 是否开启批量合并上报
  batchSize?: number; // 批量上报触发条数，默认 10
  batchInterval?: number; // 批量上报定时冲刷间隔，默认 5000ms
}

//录屏插件参数
export interface RecordScreenOptions {
  recordScreenDuration?: number; //单次录屏时长
  recordScreenTypeList?: string[]; //上报录屏的错误列表
}
