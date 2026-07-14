//注册所有事件处理程序
import { HandleEvents } from "./handleEvents";
import { addReplaceHandler, breadcrumb } from "./index";
import { htmlElementAsString, getTimestamp } from "@websdk/utils";
import { EVENT_TYPE, STATUS_CODE } from "@websdk/common";

export function setupReplace() {
  //白屏检测
  addReplaceHandler({
    callback: () => {
      HandleEvents.handleWhiteScreen();
    },
    type: EVENT_TYPE.WHITESCREEN,
  });
  //重写xhr
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EVENT_TYPE.XHR);
    },
    type: EVENT_TYPE.XHR,
  });
  //重写fetch
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EVENT_TYPE.FETCH);
    },
    type: EVENT_TYPE.FETCH,
  });
  //捕获错误2
  addReplaceHandler({
    callback: error => {
      HandleEvents.handleError(error);
    },
    type: EVENT_TYPE.ERROR,
  });
  //监听history路由变化
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHistory(data);
    },
    type: EVENT_TYPE.HISTORY,
  });
  // 添加handleUnhandleRejection事件
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleUnhandleRejection(data);
    },
    type: EVENT_TYPE.UNHANDLEDREJECTION,
  });
  //监听click事件
  addReplaceHandler({
    callback: data => {
      //获取html信息
      const htmlString = htmlElementAsString(data.data.activeElement as HTMLElement);
      if (htmlString) {
        breadcrumb.push({
          type: EVENT_TYPE.CLICK,
          status: STATUS_CODE.OK,
          category: breadcrumb.getCategory(EVENT_TYPE.CLICK),
          data: htmlString,
          time: getTimestamp(),
        });
      }
    },
    type: EVENT_TYPE.CLICK,
  });
  //监听hashchange事件
  addReplaceHandler({
    callback: (e: HashChangeEvent) => {
      HandleEvents.handleHashChange(e);
    },
    type: EVENT_TYPE.HASHCHANGE,
  });
}
