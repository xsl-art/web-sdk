//统一处理所有事件
import ErrorStackParser from "error-stack-parser";
import {
  openWhiteScreen,
  transportData,
  breadcrumb,
  resourceTransform,
  httpTransform,
  options,
} from "./index";
import { EVENT_TYPE, STATUS_CODE } from "@websdk/common";
import {
  getErrorUid,
  hashMapExist,
  getTimestamp,
  parseUrlToObj,
  unknownToString,
} from "@websdk/utils";
import { ErrorTarget, RouteHistory, HttpData } from "@websdk/types";

function safeUnknownToString(target: unknown): string {
  try {
    const result = unknownToString(target);
    return result === undefined ? String(target) : result;
  } catch {
    return Object.prototype.toString.call(target);
  }
}

function getErrorSource(ev: ErrorTarget): any {
  return ev.error || ev;
}

function getErrorMessage(error: any, fallback?: unknown): string {
  return error?.message || safeUnknownToString(fallback ?? error);
}

function getErrorStack(error: any): string {
  return error?.stack || "";
}

function getFirstStackFrame(error: any): {
  fileName?: string;
  columnNumber?: number;
  lineNumber?: number;
} {
  try {
    return ErrorStackParser.parse(error)[0] || {};
  } catch {
    return {};
  }
}

const HandleEvents = {
  //处理xhr fetch回调
  handleHttp(data: HttpData, type: EVENT_TYPE): void {
    const result = httpTransform(data);
    //添加用户行为,去掉自身上报的接口行为
    if (!data.url.includes(options.dsn)) {
      breadcrumb.push({
        type,
        category: breadcrumb.getCategory(type),
        data: result,
        status: result.status,
        time: data.time,
      });
    }
    if (result.status === "error") {
      //上报接口错误
      transportData.send({
        ...result,
        type,
        status: STATUS_CODE.ERROR,
      });
    }
  },
  handleError(ev: ErrorTarget): void {
    const target = ev.target;
    if (!target || (ev.target && !ev.target.localName)) {
      // vue和react捕获的报错使用ev解析，异步错误使用ev.error解析
      const error = getErrorSource(ev);
      const stackFrame = getFirstStackFrame(error);
      const { fileName = "", columnNumber = 0, lineNumber = 0 } = stackFrame;
      const message = getErrorMessage(error, ev.message);
      const errorUid: string = getErrorUid(
        `${EVENT_TYPE.ERROR}-${message}-${fileName}-${lineNumber}-${columnNumber}`,
      );
      const errorData = {
        type: EVENT_TYPE.ERROR,
        status: STATUS_CODE.ERROR,
        time: getTimestamp(),
        message,
        fileName,
        line: lineNumber,
        column: columnNumber,
        stack: getErrorStack(error),
        errorUid,
      };
      breadcrumb.push({
        type: EVENT_TYPE.ERROR,
        category: breadcrumb.getCategory(EVENT_TYPE.ERROR),
        data: errorData,
        time: getTimestamp(),
        status: STATUS_CODE.ERROR,
      });

      //开启repeatCodeError第一次报错才上报
      if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(errorUid))) {
        return transportData.send(errorData);
      }
    }

    //资源加载错误
    if (target?.localName) {
      //提取资源加载信息
      const data = resourceTransform(target);
      breadcrumb.push({
        type: EVENT_TYPE.ERROR,
        category: breadcrumb.getCategory(EVENT_TYPE.ERROR),
        data,
        time: getTimestamp(),
        status: STATUS_CODE.ERROR,
      });
      return transportData.send({
        ...data,
        type: EVENT_TYPE.RESOURCE,
        status: STATUS_CODE.ERROR,
      });
    }
  },
  handleHistory(data: RouteHistory): void {
    const { from, to } = data;
    // 定义parsedFrom变量，值为relative
    const { relative: parsedFrom } = parseUrlToObj(from);
    const { relative: parsedTo } = parseUrlToObj(to);
    breadcrumb.push({
      type: EVENT_TYPE.HISTORY,
      category: breadcrumb.getCategory(EVENT_TYPE.HISTORY),
      data: {
        from: parsedFrom ? parsedFrom : "/",
        to: parsedTo ? parsedTo : "/",
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    });
  },
  handleHashChange(data: HashChangeEvent): void {
    const { oldURL, newURL } = data;
    const { relative: from } = parseUrlToObj(oldURL);
    const { relative: to } = parseUrlToObj(newURL);
    breadcrumb.push({
      type: EVENT_TYPE.HASHCHANGE,
      category: breadcrumb.getCategory(EVENT_TYPE.HASHCHANGE),
      data: {
        from,
        to,
      },
      time: getTimestamp(),
      status: STATUS_CODE.OK,
    });
  },
  handleUnhandleRejection(ev: PromiseRejectionEvent): void {
    const reason = ev.reason;
    const stackFrame = getFirstStackFrame(reason);
    const { fileName = "", columnNumber = 0, lineNumber = 0 } = stackFrame;
    const message = getErrorMessage(reason, reason);
    const errorUid: string = getErrorUid(
      `${EVENT_TYPE.UNHANDLEDREJECTION}-${message}-${fileName}-${lineNumber}-${columnNumber}`,
    );
    const data = {
      type: EVENT_TYPE.UNHANDLEDREJECTION,
      status: STATUS_CODE.ERROR,
      time: getTimestamp(),
      message,
      fileName,
      line: lineNumber,
      column: columnNumber,
      stack: getErrorStack(reason),
      errorUid,
    };
    breadcrumb.push({
      type: EVENT_TYPE.UNHANDLEDREJECTION,
      category: breadcrumb.getCategory(EVENT_TYPE.UNHANDLEDREJECTION),
      time: getTimestamp(),
      status: STATUS_CODE.ERROR,
      data,
    });
    // 开启repeatCodeError第一次报错才上报
    if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(errorUid))) {
      transportData.send(data);
    }
  },
  handleWhiteScreen(): void {
    openWhiteScreen((res: any) => {
      console.log("白屏返回值", res);
      //上报白屏监测信息
      transportData.send({
        type: EVENT_TYPE.WHITESCREEN,
        time: getTimestamp(),
        ...res,
      });
    }, options);
  },
};

export { HandleEvents };
