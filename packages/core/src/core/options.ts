//配置
import { validateOption, _support, setMonitorFlag } from "@websdk/utils";
import { InitOptions } from "@websdk/types";
//import { breadcrumb } from "./breadcrumb";
//import { transportData } from "./reportData";

export class Options {
  dsn = "";
  throttleDelayTime = 0;
  overTime = 10;
  whiteBoxElements: string[] = ["html", "body", "#app", "#root"];
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

export function handleOptions(paramOptions: InitOptions) {
  // setSilentFlag 给全局添加已设置的标识，防止重复设置
  setMonitorFlag(paramOptions);
  //设置用户行为的配置项

  //配置上报的信息

  //绑定其他配置项
  options.bindOptions(paramOptions);
}

export { options };
