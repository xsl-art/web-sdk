import { record } from "rrweb";
import { gzip } from "pako";
import { Base64 } from "js-base64";
import { getTimestamp, generateUUID, _support } from "@xyz-sdk/utils";
import { EVENT_TYPE, STATUS_CODE } from "@xyz-sdk/common";

const MAX_EVENTS = 800;

/** 处理录屏事件 */
export function handleScreen(transportData: any, recordScreenDuration: number): void {
  let events: any[] = [];
  let lastFullSnapshotIndex = -1;
  // 用于延迟处理 checkout，因为 rrweb 的 takeFullSnapshot 会先 emit Meta 再 emit FullSnapshot
  let pendingCheckout = false;

  function doCheckout() {
    if (_support.hasError) {
      const hasFullSnapshot = events.some(e => e.type === 2);
      if (hasFullSnapshot && events.length > 0) {
        const recordScreenId = _support.recordScreenId;
        _support.recordScreenId = generateUUID();
        transportData.send({
          type: EVENT_TYPE.RECORDSCREEN,
          recordScreenId,
          time: getTimestamp(),
          status: STATUS_CODE.OK,
          events: zip(events),
        });
      }
      events = [];
      lastFullSnapshotIndex = -1;
      _support.hasError = false;
    } else {
      // 没有错误时，保留最新的 FullSnapshot 作为下一个周期的起点
      // 这样后续的事件数组始终以 FullSnapshot 开头
      let lastFsIndex = -1;
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].type === 2) {
          lastFsIndex = i;
          break;
        }
      }
      if (lastFsIndex >= 0) {
        events = events.slice(lastFsIndex);
        lastFullSnapshotIndex = 0;
      } else {
        events = [];
        lastFullSnapshotIndex = -1;
      }
      _support.recordScreenId = generateUUID();
    }
    pendingCheckout = false;
  }

  record({
    emit(event, isCheckout) {
      events.push(event);

      if (event.type === 2) {
        lastFullSnapshotIndex = events.length - 1;
      }

      if (isCheckout) {
        // rrweb 的 takeFullSnapshot 会先 emit Meta(type=4) 再 emit FullSnapshot(type=2)
        // 两个都是 isCheckout=true。我们需要在 FullSnapshot 时再处理 checkout
        if (event.type === 2) {
          // FullSnapshot 事件，执行 pending 的 checkout
          doCheckout();
        } else {
          // Meta 或其他 checkout 事件，标记 pending，等待 FullSnapshot
          pendingCheckout = true;
        }
        return;
      }

      // 非 checkout 事件，如果之前有 pending 的 checkout，检查是否需要处理
      // 正常情况下 rrweb 的 takeFullSnapshot 是同步的，FullSnapshot 会紧跟 Meta
      // 这里作为兜底：如果 pendingCheckout 且遇到了非 checkout 事件，说明 FullSnapshot 可能缺失
      if (pendingCheckout) {
        doCheckout();
      }

      if (events.length >= MAX_EVENTS) {
        if (lastFullSnapshotIndex > 0) {
          events = events.slice(lastFullSnapshotIndex);
          lastFullSnapshotIndex = 0;
        }
      }
    },
    recordCanvas: false,
    checkoutEveryNms: 1000 * recordScreenDuration,
  });
}

//压缩
export function zip(data: any): string {
  if (!data) return data;
  const dataJson =
    typeof data !== "string" && typeof data !== "number" ? JSON.stringify(data) : data;
  const str = Base64.encode(dataJson as string);
  const binaryString = gzip(str);
  const arr = Array.from(binaryString);
  let s = "";
  arr.forEach((item: any) => {
    s += String.fromCharCode(item);
  });
  return Base64.btoa(s);
}
