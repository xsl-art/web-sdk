import { ReportData, BreadcrumbData } from "./base";

export interface InitOptions {
  dsn: string; //上报地址
  apiKey: string; //项目id
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
  throttleDelayTime?: number; // 节流时间间隔
  overTime?: number; // 超时时间
  maxBreadcrumbs?: number; // 存放用户行为最大长度
  beforePushBreadcrumb?(data: BreadcrumbData): BreadcrumbData; // 添加到行为列表前的 hook
  beforeDataReport?(data: ReportData): Promise<ReportData | boolean>; // 上报前的 hook
  getUserId?: () => string | number;
  handleHttpStatus?: (data: any) => boolean; // 处理接口返回的 response
  repeatCodeError?: boolean; // 是否去除重复的代码错误，重复的错误只上报一次
}

//录屏插件参数
export interface RecordScreenOptions {
  recordScreenDuration?: number; //单次录屏时长
  recordScreenTypeList?: string[]; //上报录屏的错误列表
}
