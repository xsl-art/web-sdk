import { transportData, options, notify, subscribeEvent } from "./index";

import {
  _global,
  on,
  getTimestamp,
  replaceAop,
  throttle,
  getLocationHref,
  variableTypeDetection,
  supportsHistory,
} from "@websdk/utils";
import { EVENT_TYPE, HTTPTYPE, METHOD } from "@websdk/common";
import { ReplaceHandler, voidFun } from "@websdk/types";

//判断当前接口是否为要过滤掉的接口
function isFilteredHttpUrl(url: string): boolean {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

function replace(type: EVENT_TYPE): void {
  switch (type) {
    case EVENT_TYPE.WHITESCREEN:
      whiteScreen();
      break;
    case EVENT_TYPE.XHR:
      xhrReplace();
      break;
    case EVENT_TYPE.FETCH:
      fetchReplace();
      break;
    case EVENT_TYPE.ERROR:
      listenError();
      break;
    case EVENT_TYPE.HISTORY:
      historyReplace();
      break;
    case EVENT_TYPE.UNHANDLEDREJECTION:
      unhandledrejectionReplace();
      break;
    case EVENT_TYPE.CLICK:
      domReplace();
      break;
    case EVENT_TYPE.HASHCHANGE:
      listenHashChange();
      break;
    default:
      break;
  }
}

export function addReplaceHandler(handler: ReplaceHandler): void {
  if (!subscribeEvent(handler)) return;
  replace(handler.type);
}

function xhrReplace(): void {
  if (!("XMLHttpRequest" in _global)) return;
  const originalXhrProto = XMLHttpRequest.prototype;
  replaceAop(originalXhrProto, "open", (originalOpen: voidFun) => {
    return function (this: any, ...args: any[]): void {
      this.websdk_xhr = {
        method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : args[0],
        url: args[1],
        type: HTTPTYPE.XHR,
        sTime: getTimestamp(),
      };
      originalOpen.apply(this, args);
    };
  });
  replaceAop(originalXhrProto, "send", (originalSend: voidFun) => {
    return function (this: any, args: any[]): void {
      const { method, url } = this.websdk_xhr;
      //监听load事件，接口成功失败都会执行
      on(this, "load", function (this: any) {
        // isSdkTransportUrl 判断当前接口是否为上报的接口
        // isFilterHttpUrl 判断当前接口是否为需要过滤掉的接口
        if (
          (method === METHOD.Post && transportData.isSdkTransportUrl(url)) ||
          isFilteredHttpUrl(url)
        )
          return;
        const { responseType, response, status } = this;
        this.websdk_xhr.requestData = args[0];
        const eTime = getTimestamp();
        // 设置该接口的time，用户行为按时间排序
        this.websdk_xhr.time = this.websdk_xhr.sTime;
        this.websdk_xhr.Status = status;
        if (["", "json", "text"].indexOf(responseType) !== -1) {
          // 用户设置handleHttpStatus函数来判断接口是否正确，只有接口报错时才保留response
          if (options.handleHttpStatus && typeof options.handleHttpStatus === "function") {
            this.websdk_xhr.response = response && JSON.parse(response);
          }
        }
        //接口执行时长
        this.websdk_xhr.elapsedTime = eTime - this.websdk_xhr.sTime;
        notify(EVENT_TYPE.XHR, this.websdk_xhr);
      });
      originalSend.apply(this, args);
    };
  });
}

function fetchReplace(): void {
  if (!("fetch" in _global)) return;
  replaceAop(_global, EVENT_TYPE.FETCH, originalFetch => {
    return function (url: any, config: Partial<Request> = {}): void {
      const sTime = getTimestamp();
      const method = (config && config.method) || "GET";
      let fetchData = {
        type: HTTPTYPE.FETCH,
        method,
        url,
        requestData: config && config.body,
        response: "",
      };
      //获取配置的headers
      const headers = new Headers(config.headers || {});
      Object.assign(headers, {
        setRequestHeader: headers.set,
      });
      config = Object.assign({}, config, headers);
      return originalFetch.apply(_global, [url, config]).then(
        (res: any) => {
          // 克隆一份，防止被标记已消费
          const tempRes = res.clone();
          const eTime = getTimestamp();
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            Status: tempRes.status,
            time: sTime,
          });
          tempRes.text().then((data: any) => {
            if (
              (method === METHOD.Post && transportData.isSdkTransportUrl(url)) ||
              isFilteredHttpUrl(url)
            )
              return;
            if (options.handleHttpStatus && typeof options.handleHttpStatus === "function") {
              fetchData.response = data;
            }
            notify(EVENT_TYPE.FETCH, fetchData);
          });
          return res;
        },
        (err: any) => {
          const eTime = getTimestamp();
          if (
            (method === METHOD.Post && transportData.isSdkTransportUrl(url)) ||
            isFilteredHttpUrl(url)
          )
            return;
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            status: 0,
            time: sTime,
          });
          notify(EVENT_TYPE.FETCH, fetchData);
          throw err;
        },
      );
    };
  });
}

function listenHashChange(): void {
  // 监听hashchange事件，兼容hash模式路由变化
  on(_global, "hashchange", function (e: HashChangeEvent) {
    notify(EVENT_TYPE.HASHCHANGE, e);
  });
}

function listenError(): void {
  on(
    _global,
    "error",
    function (e: ErrorEvent) {
      console.error(e);
      notify(EVENT_TYPE.ERROR, e);
    },
    true,
  );
}

let lastHref: string = getLocationHref();
function historyReplace(): void {
  if (!supportsHistory()) return;
  console.log("[web-sdk] historyReplace 注册成功");
  const oldOnpopstate = _global.onpopstate;
  _global.onpopstate = function (this: any, ...args: any): void {
    const to = getLocationHref();
    const from = lastHref;
    lastHref = to;
    console.log("[web-sdk] popstate 路由变化 from:", from, "to:", to);
    notify(EVENT_TYPE.HISTORY, { from, to });
    oldOnpopstate && oldOnpopstate.apply(this, args);
  };

  function historyReplaceFn(originalHistoryFn: voidFun): voidFun {
    return function (this: any, ...args: any[]): any {
      const url = args.length > 2 ? args[2] : undefined;
      if (url) {
        const from = lastHref;
        const to = String(new URL(url, location.href));
        lastHref = to;
        console.log("[web-sdk] pushState/replaceState 路由变化 from:", from, "to:", to);
        notify(EVENT_TYPE.HISTORY, { from, to });
      }
      return originalHistoryFn.apply(this, args);
    };
  }
  // 重写pushState、replaceState事件
  replaceAop(_global.history, "pushState", historyReplaceFn);
  replaceAop(_global.history, "replaceState", historyReplaceFn);
}

function unhandledrejectionReplace(): void {
  on(_global, EVENT_TYPE.UNHANDLEDREJECTION, function (ev: PromiseRejectionEvent) {
    notify(EVENT_TYPE.UNHANDLEDREJECTION, ev);
  });
}

function domReplace(): void {
  if (!("document" in _global)) return;
  console.log("[web-sdk] domReplace 注册成功");
  const clickThrottle = throttle(notify, options.throttleDelayTime);
  on(
    _global.document,
    "click",
    function (event: MouseEvent): void {
      const activeElement = event.target as HTMLElement;
      if (!activeElement) return;
      console.log("[web-sdk] document click:", activeElement.tagName, activeElement.className);
      clickThrottle(EVENT_TYPE.CLICK, {
        category: "click",
        data: { activeElement },
      });
    },
    true,
  );
}

function whiteScreen(): void {
  notify(EVENT_TYPE.WHITESCREEN);
}
