//手动上报
import ErrorStackParser from "error-stack-parser";
import { transportData } from "./reportData";
import { breadcrumb } from "./breadcrumb";
import { isError, getTimestamp, unknownToString } from "@xyz-sdk/utils";
import { EVENT_TYPE, STATUS_CODE } from "@xyz-sdk/common";

//自定义事件上报
export function log({ message = "customMsg", error = "", type = EVENT_TYPE.CUSTOM }: any): void {
  try {
    let errorInfo = {};
    if (isError(error)) {
      const result = ErrorStackParser.parse(!error.target ? error : error.error || error.reason)[0];
      errorInfo = { ...result, line: result.lineNumber, column: result.columnNumber };
    }
    breadcrumb.push({
      type,
      status: STATUS_CODE.ERROR,
      category: breadcrumb.getCategory(EVENT_TYPE.CUSTOM),
      data: unknownToString(message),
      time: getTimestamp(),
    });
    transportData.send({
      type,
      status: STATUS_CODE.ERROR,
      message: unknownToString(message),
      time: getTimestamp(),
      ...errorInfo,
    });
  } catch {
    throw new Error("自定义上报失败");
  }
}
