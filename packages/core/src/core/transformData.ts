import { options } from "./options";
import { fromHttpStatus, interceptStr, getTimestamp } from "@websdk/utils";
import { HTTP_CODE, STATUS_CODE } from "@websdk/common";
import { HttpData, ResourceError, ResourceTarget } from "@websdk/types";

/**
 * 处理接口数据
 * @param data 接口数据
 * @returns 处理后的接口数据
 */
export function httpTransform(data: HttpData): HttpData {
  let message: any = "";
  const { elapsedTime, time, method = "", type, Status = 200, response, requestData } = data;
  let status: STATUS_CODE;
  if (Status === 0) {
    status = STATUS_CODE.ERROR;
    message =
      elapsedTime <= options.overTime * 1000
        ? `请求失败，Status值为:${Status}`
        : "请求失败，接口超时";
  } else if ((Status as number) < HTTP_CODE.BAD_REQUEST) {
    status = STATUS_CODE.OK;
    if (options.handleHttpStatus && typeof options.handleHttpStatus == "function") {
      if (options.handleHttpStatus(data)) {
        status = STATUS_CODE.OK;
      } else {
        status = STATUS_CODE.ERROR;
        message = `接口报错，报错信息为：${
          typeof response == "object" ? JSON.stringify(response) : response
        }`;
      }
    }
  } else {
    status = STATUS_CODE.ERROR;
    message = `请求失败，Status值为:${Status}，${fromHttpStatus(Status as number)}`;
  }
  message = `${data.url};${message}`;
  return {
    url: data.url,
    time,
    status,
    elapsedTime,
    message,
    requestData: {
      httpType: type as string,
      method,
      data: requestData || "",
    },
    response: {
      Status,
      data: status === STATUS_CODE.ERROR ? response : null,
    },
  };
}

/**
 * 处理资源数据
 * @param target 资源对象
 * @returns time 时间戳
 * @returns message 报错信息
 * @returns name 资源类型名
 */
export function resourceTransform(target: ResourceTarget): ResourceError {
  return {
    time: getTimestamp(),
    message:
      (interceptStr(target.src as string, 120) || interceptStr(target.href as string, 120)) +
      "; 资源加载失败",
    name: target.localName as string,
  };
}
