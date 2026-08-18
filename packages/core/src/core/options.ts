import { validateOption, _support } from "@xyz-sdk/utils";
import { InitOptions } from "@xyz-sdk/types";

/**
 * 配置项
 */
export class Options {
  dsn = "";
  throttleDelayTime = 0;
  overTime = 10;
  whiteBoxElements: string[] = ["html", "body", "#app", "#root"];
  monitorError = true;
  monitorUnhandleRejection = true;
  monitorXhr = true;
  monitorFetch = true;
  monitorClick = true;
  monitorHistory = true;
  monitorHashChange = true;
  monitorWhiteScreen = false;
  skeletonProject = false;
  filterXhrUrlRegExp: any;
  handleHttpStatus: any;
  repeatCodeError = false;

  constructor() {}
  bindOptions(options: InitOptions): void {
    const {
      dsn,
      throttleDelayTime = 0,
      overTime = 10,
      whiteBoxElements = ["html", "body", "#app", "#root"],
      monitorError = true,
      monitorUnhandleRejection = true,
      monitorXhr = true,
      monitorFetch = true,
      monitorClick = true,
      monitorHistory = true,
      monitorHashChange = true,
      monitorWhiteScreen = false,
      skeletonProject = false,
      filterXhrUrlRegExp,
      handleHttpStatus,
      repeatCodeError = false,
    } = options;
    validateOption(dsn, "dsn", "string") && (this.dsn = dsn);
    validateOption(throttleDelayTime, "throttleDelayTime", "number") &&
      (this.throttleDelayTime = throttleDelayTime);
    validateOption(overTime, "overTime", "number") && (this.overTime = overTime);
    validateOption(filterXhrUrlRegExp, "filterXhrUrlRegExp", "regexp") &&
      (this.filterXhrUrlRegExp = filterXhrUrlRegExp);
    validateOption(monitorError, "monitorError", "boolean") && (this.monitorError = monitorError);
    validateOption(monitorUnhandleRejection, "monitorUnhandleRejection", "boolean") &&
      (this.monitorUnhandleRejection = monitorUnhandleRejection);
    validateOption(monitorXhr, "monitorXhr", "boolean") && (this.monitorXhr = monitorXhr);
    validateOption(monitorFetch, "monitorFetch", "boolean") && (this.monitorFetch = monitorFetch);
    validateOption(monitorClick, "monitorClick", "boolean") && (this.monitorClick = monitorClick);
    validateOption(monitorHistory, "monitorHistory", "boolean") &&
      (this.monitorHistory = monitorHistory);
    validateOption(monitorHashChange, "monitorHashChange", "boolean") &&
      (this.monitorHashChange = monitorHashChange);
    validateOption(monitorWhiteScreen, "monitorWhiteScreen", "boolean") &&
      (this.monitorWhiteScreen = monitorWhiteScreen);
    validateOption(skeletonProject, "skeletonProject", "boolean") &&
      (this.skeletonProject = skeletonProject);
    validateOption(whiteBoxElements, "whiteBoxElements", "array") &&
      (this.whiteBoxElements = whiteBoxElements);
    validateOption(handleHttpStatus, "handleHttpStatus", "function") &&
      (this.handleHttpStatus = handleHttpStatus);
    validateOption(repeatCodeError, "repeatCodeError", "boolean") &&
      (this.repeatCodeError = repeatCodeError);
  }
}

const options = _support.options || (_support.options = new Options());

export { options };
