import { setFlag, _support } from "./global";
import { EVENT_TYPE } from "@websdk/common";

/**返回包含id class innerText字符串的标签 */
export function htmlElementAsString(target: HTMLElement): string {
  const tagName = target.tagName.toLowerCase();
  if (tagName === "body") return "";
  let classNames = target.classList.value;
  classNames = classNames !== "" ? `class="${classNames}"` : "";
  const id = target.id ? `id="${target.id}"` : "";
  const innerText = target.innerText;
  return `<${tagName}${id}${classNames !== "" ? classNames : ""}>${innerText}</${tagName}>`;
}

/**地址字符串转换为对象
 * 输入：'https://github.com/xy-sea/web-see?token=123&name=11'
 * 输出：{
 *  "host": "github.com",
 *  "path": "/xy-sea/web-see",
 *  "protocol": "https",
 *  "relative": "/xy-sea/web-see?token=123&name=11"
 * }
 */

export function parseUrlToObj(url: string) {
  if (!url) return {};
  const match = url.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!match) return {};
  const query = match[6] || "";
  const fragment = match[8] || "";
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    relative: match[5] + query + fragment,
  };
}

export function setMonitorFlag({
  monitorXhr = true,
  monitorFetch = true,
  monitorClick = true,
  monitorError = true,
  monitorUnhandleRejection = true,
  monitorHistory = true,
  monitorHashChange = true,
  monitorWhiteScreen = true,
}): void {
  setFlag(EVENT_TYPE.XHR, monitorXhr);
  setFlag(EVENT_TYPE.FETCH, monitorFetch);
  setFlag(EVENT_TYPE.CLICK, monitorClick);
  setFlag(EVENT_TYPE.ERROR, monitorError);
  setFlag(EVENT_TYPE.UNHANDLEDREJECTION, monitorUnhandleRejection);
  setFlag(EVENT_TYPE.HISTORY, monitorHistory);
  setFlag(EVENT_TYPE.HASHCHANGE, monitorHashChange);
  setFlag(EVENT_TYPE.WHITESCREEN, monitorWhiteScreen);
}

//每一个错误生成唯一编码

export function getErrorUid(input: string): string {
  return window.btoa(encodeURIComponent(input));
}

//判断hash是否已存在
export function hashMapExist(hash: string): boolean {
  const exist = _support.errorMap.has(hash);
  if (!exist) {
    _support.errorMap.set(hash, true);
  }
  return exist;
}
