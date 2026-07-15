//统一上报
import {
  _support,
  validateOption,
  isBrowserEnv,
  Queue,
  isEmpty,
  getLocationHref,
  generateUUID,
} from "@websdk/utils";
import { SDK_VERSION, EVENT_TYPE } from "@websdk/common";
import { ReportData, InitOptions } from "@websdk/types";
import { breadcrumb } from "./breadcrumb";
import { options } from "./options";

export class TransportData {
  queue: Queue = new Queue(); //消息队列
  apiKey = ""; //项目标识符
  errorDsn = ""; //监控上报接口的地址
  userId = "";
  uuid: string; //每次页面加载的唯一标识符
  beforeDataReport: any;
  getUserId: any; //用户自定义获取userID的方法
  useImgUpload = false;
  constructor() {
    this.uuid = generateUUID();
  }

  beacon(url: string, data: any): boolean {
    // 使用 Blob 指定 application/json，确保后端 body-parser 能正确解析
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    return navigator.sendBeacon(url, blob);
  }

  imgRequest(data: ReportData, url: string): void {
    const requestFun = () => {
      const img = new Image();
      const spliceStr = url.indexOf("?") === -1 ? "?" : "&";
      img.src = `${url}${spliceStr}data=${encodeURIComponent(JSON.stringify(data))}`;
    };
    this.queue.addFn(requestFun);
  }

  async beforePost(this: any, data: ReportData): Promise<ReportData | boolean> {
    let transportData = this.getTransportData(data);
    if (typeof this.beforeDataReport === "function") {
      transportData = this.beforeDataReport(transportData);
      if (!transportData) return false;
    }
    return transportData;
  }

  async xhrPost(data: ReportData, url: string): Promise<void> {
    const requestFun = () => {
      fetch(`${url}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    };
    this.queue.addFn(requestFun);
  }

  getAuthInfo(): any {
    return {
      userId: this.userId || this.getAuthId() || "",
      sdkVersion: SDK_VERSION,
      apiKey: this.apiKey,
    };
  }

  getAuthId(): string | number {
    if (typeof this.getUserId === "function") {
      const id = this.getUserId();
      if (typeof id === "string" || typeof id === "number") {
        return id;
      } else {
        console.error(`web-see userId: ${id} 期望 string 或 number 类型，但是传入 ${typeof id}`);
      }
    }
    return "";
  }

  //添加公共信息
  getTransportData(data: any): ReportData {
    const info = {
      ...data,
      ...this.getAuthInfo(), //获取用户信息
      uuid: this.uuid,
      pageUrl: getLocationHref(),
      deviceInfo: _support.deviceInfo,
    };

    // 性能数据、录屏、白屏检测等不需要附带用户行为
    const excludeRreadcrumb = [
      EVENT_TYPE.PERFORMANCE,
      EVENT_TYPE.RECORDSCREEN,
      EVENT_TYPE.WHITESCREEN,
    ];

    if (!excludeRreadcrumb.includes(data.type)) {
      info.breadcrumb = breadcrumb.getStack(); //获取用户行为栈
    }
    return info;
  }

  //判断请求是否为sdk配置的接口
  isSdkTransportUrl(targetUrl: string): boolean {
    let isSdkDsn = false;
    if (this.errorDsn && targetUrl.indexOf(this.errorDsn) !== -1) isSdkDsn = true;
    return isSdkDsn;
  }

  bindOptions(options: InitOptions): void {
    const { dsn, apiKey, beforeDataReport, userId, getUserId, useImgUpload } = options;
    validateOption(apiKey, "apiKey", "string") && (this.apiKey = apiKey);
    validateOption(dsn, "dsn", "string") && (this.errorDsn = dsn);
    validateOption(userId, "userId", "string") && (this.userId = userId || "");
    validateOption(useImgUpload, "useImgUpload", "boolean") &&
      (this.useImgUpload = useImgUpload || false);
    validateOption(beforeDataReport, "beforeDataReport", "function") &&
      (this.beforeDataReport = beforeDataReport);
    validateOption(getUserId, "getUserId", "function") && (this.getUserId = getUserId);
  }

  //上报数据
  async send(data: ReportData) {
    const dsn = this.errorDsn;
    if (isEmpty(dsn)) {
      console.error("web-see: dsn为空，没有传入监控错误上报的dsn地址，请在init中传入");
      return;
    }
    //开启录屏，由@websdk/recordScreen 插件控制
    if (_support.options.monitorRecordScreen) {
      if (options.recordScreenTypeList.includes(data.type)) {
        //修改hasError
        _support.hasError = true;
        data.recordScreenId = _support.recordScreenId;
        console.log("[web-sdk] 触发录屏标记 type:", data.type, "recordScreenId:", data.recordScreenId);
      }
    }
    const result = (await this.beforePost(data)) as ReportData;
    if (isBrowserEnv && result) {
      //优先使用sendBeacon
      const value = this.beacon(dsn, result);
      if (!value) {
        return this.useImgUpload ? this.imgRequest(result, dsn) : this.xhrPost(result, dsn);
      }
    }
  }
}

const transportData = _support.transportData || (_support.transportData = new TransportData());
export { transportData };
