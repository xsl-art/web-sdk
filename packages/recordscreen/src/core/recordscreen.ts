import { record } from "rrweb";
import { gzip } from "pako";
import { Base64 } from "js-base64";
import { getTimestamp, generateUUID, _support } from "@xyz-sdk/utils";
import { EVENT_TYPE, STATUS_CODE } from "@xyz-sdk/common";

/** 处理录屏事件 */
export function handleScreen(transportData: any, recordScreenDuration: number): void {
  //events存储录屏信息
  let events: any[] = [];
  record({
    //每帧回调
    emit(event, isCheckout) {
      if (isCheckout) {
        // 此段时间内发生错误，上报录屏信息
        if (_support.hasError) {
          const recordScreenId = _support.recordScreenId;
          _support.recordScreenId = generateUUID();
          transportData.send({
            type: EVENT_TYPE.RECORDSCREEN,
            recordScreenId,
            time: getTimestamp(),
            status: STATUS_CODE.OK,
            events: zip(events),
          });
          events = [];
          _support.hasError = false;
        } else {
          //不上报清空录屏
          events = [];
          _support.recordScreenId = generateUUID();
        }
      }
      events.push(event);
    },
    recordCanvas: true,
    //默认每10s触发isCheckout=true
    checkoutEveryNms: 1000 * recordScreenDuration,
  });
}

//压缩
export function zip(data: any): string {
  if (!data) return data;
  //判断数据是否需要转为JSON
  const dataJson =
    typeof data !== "string" && typeof data !== "number" ? JSON.stringify(data) : data;
  // 使用Base64.encode处理字符编码，兼容中文
  const str = Base64.encode(dataJson as string);
  const binaryString = gzip(str);
  const arr = Array.from(binaryString);
  let s = "";
  arr.forEach((item: any) => {
    s += String.fromCharCode(item);
  }); //转换为二进制字符串
  return Base64.btoa(s);
}
