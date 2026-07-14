import { variableTypeDetection } from "./verifyType";
import { Callback, IAnyObject } from "@websdk/types";

export function getLocationHref(): string {
  if (typeof document === "undefined" || document.location == null) return "";
  return document.location.href;
}

/**添加事件监听器
 * @param target 事件目标
 * @param eventName 事件名称
 * @param handler 事件处理函数
 * @param option 事件选项
 */
export function on(target: any, eventName: string, handler: Callback, option = false) {
  target.addEventListener(eventName, handler, option);
}

/**重写对象上的某个属性
 * @param source 目标对象
 * @param name 属性名称
 * @param replacement 以原有的函数作为参数，执行并重写原有函数
 * @param isForced 是否强制替换(原先没有某些属性)
 */

export function replaceAop(
  source: IAnyObject,
  name: string,
  replacement: Callback,
  isForced = false,
) {
  if (source === undefined) return;
  if (name in source || isForced) {
    const original = source[name];
    const wrapper = replacement(original);
    if (typeof wrapper === "function") {
      source[name] = wrapper;
    }
  }
}

/**函数节流 */
export const throttle = (fn: any, delay: number) => {
  let canRun = true;
  return function (this: any, ...args: any[]) {
    if (!canRun) return;
    fn.apply(this, args);
    canRun = false;
    setTimeout(() => {
      canRun = true;
    }, delay);
  };
};

//获取当前时间戳
export function getTimestamp(): number {
  return Date.now();
}

//获取当前日期
export function getYMDHMS(): string {
  const dateTime = new Date();
  const year = dateTime.getFullYear(),
    month = ("0" + (dateTime.getMonth() + 1)).slice(-2),
    date = ("0" + dateTime.getDate()).slice(-2);
  return `${year}-${month}-${date}`;
}

export function typeofAny(target: any): string {
  return Object.prototype.toString.call(target).slice(8, -1).toLowerCase();
}

export function toStringAny(target: any, type: string): boolean {
  return Object.prototype.toString.call(target) === type;
}

//验证选项的类型
export function validateOption(target: any, targetName: string, expectType: string): any {
  if (!target) return false;
  if (typeofAny(target) === expectType) return true;
  console.error(`web-see: ${targetName}期望传入${expectType}类型，目前是${typeofAny(target)}类型`);
}

export function generateUUID(): string {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = ((d + Math.random() * 16) % 16) | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

export function unknownToString(target: unknown): string {
  if (variableTypeDetection.isString(target)) {
    return target as string;
  }
  if (variableTypeDetection.isUndefined(target)) {
    return "undefined";
  }
  return JSON.stringify(target);
}

export function interceptStr(str: string, interceptLength: number): string {
  if (variableTypeDetection.isString(str)) {
    return (
      str.slice(0, interceptLength) +
      (str.length > interceptLength ? `:截取前${interceptLength}个字符` : "")
    );
  }
  return "";
}
