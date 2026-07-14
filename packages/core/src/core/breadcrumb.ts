import { EVENT_TYPE, USER_ACTION } from "@websdk/common";
import { validateOption, getTimestamp, _support } from "@websdk/utils";
import { BreadcrumbData, InitOptions } from "@websdk/types";

export class Breadcrumb {
  maxBreadcrumbs = 20;
  beforePushBreadcrumb: unknown = null;
  stack: BreadcrumbData[];
  constructor() {
    this.stack = [];
  }
  //添加用户行为栈
  push(data: BreadcrumbData): void {
    if (typeof this.beforePushBreadcrumb === "function") {
      //执行用户自定义hook
      const result = this.beforePushBreadcrumb(data) as BreadcrumbData;
      if (!result) return;
      this.immediatePush(result);
      return;
    }
    this.immediatePush(data);
  }

  immediatePush(data: BreadcrumbData): void {
    data.time || (data.time = getTimestamp());
    if (this.stack.length >= this.maxBreadcrumbs) {
      this.shift();
    }
    this.stack.push(data);
    this.stack.sort((a, b) => a.time - b.time);
  }

  shift(): boolean {
    return this.stack.shift() !== undefined;
  }

  clear(): void {
    this.stack = [];
  }

  getStack(): BreadcrumbData[] {
    return this.stack;
  }

  getCategory(type: EVENT_TYPE): USER_ACTION {
    switch (type) {
      //接口请求
      case EVENT_TYPE.XHR:
      case EVENT_TYPE.FETCH:
        return USER_ACTION.HTTP;

      //用户点击
      case EVENT_TYPE.CLICK:
        return USER_ACTION.CLICK;

      //路由变化
      case EVENT_TYPE.HISTORY:
      case EVENT_TYPE.HASHCHANGE:
        return USER_ACTION.ROUTER;

      //加载资源
      case EVENT_TYPE.RESOURCE:
        return USER_ACTION.RESOURCE;

      //js代码报错
      case EVENT_TYPE.UNHANDLEDREJECTION:
      case EVENT_TYPE.ERROR:
        return USER_ACTION.CODEERROR;

      //用户自定义
      default:
        return USER_ACTION.CUSTOM;
    }
  }

  bindOptions(options: InitOptions): void {
    // maxBreadcrumbs 用户行为存放的最大容量
    // beforePushBreadcrumb 添加用户行为前的处理函数
    const { maxBreadcrumbs, beforePushBreadcrumb } = options;
    validateOption(maxBreadcrumbs, "maxBreadcrumbd", "number") &&
      (this.maxBreadcrumbs = maxBreadcrumbs || 20);
    validateOption(beforePushBreadcrumb, "beforePushBreadcrumb", "function") &&
      (this.beforePushBreadcrumb = beforePushBreadcrumb);
  }
}

const breadcrumb = _support.Breadcrumb || (_support.Breadcrumb = new Breadcrumb());
export { breadcrumb };
