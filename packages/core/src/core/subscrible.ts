import { getFlag, nativeTryCatch, setFlag } from "@websdk/utils";
import { ReplaceHandler, ReplaceCallback } from "@websdk/types";
import { EVENT_TYPE } from "@websdk/common";

const handlers: { [key in EVENT_TYPE]?: ReplaceCallback[] } = {};

// subscribeEvent 设置标识，并将处理的方法放置到handlers中，{ xhr: [ funtion ] }
export function subscribeEvent(handler: ReplaceHandler): boolean {
  if (!handler || getFlag(handler.type)) return false;
  setFlag(handler.type, true);
  handlers[handler.type] = handlers[handler.type] || [];
  handlers[handler.type]?.push(handler.callback);
  return true;
}

export function notify(type: EVENT_TYPE, data?: any): void {
  if (!type || !handlers[type]) return;
  // 获取对应事件的回调函数并执行，回调函数为addReplaceHandler事件中定义的事件
  handlers[type]?.forEach(callback => {
    nativeTryCatch(
      () => callback(data),
      () => {
        // console.error(
        //   `web-see 重写事件notify的回调函数发生错误\nType:${type}\nName: ${getFunctionName(
        //     callback
        //   )}\nError: ${e}`
        // );
      },
    );
  });
}
