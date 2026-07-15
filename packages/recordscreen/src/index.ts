import { handleScreen } from "./core/recordscreen";
import { SdkBase, RecordScreenOptions, BasePlugin } from "@websdk/types";
import { EVENT_TYPE } from "@websdk/common";
import { validateOption, generateUUID, _support } from "@websdk/utils";

export default class RecordScreen extends BasePlugin {
  type: string;
  recordScreenDuration = 10; //默认录屏时长
  recordScreenTypeList: string[] = [
    EVENT_TYPE.ERROR,
    EVENT_TYPE.UNHANDLEDREJECTION,
    EVENT_TYPE.RESOURCE,
    EVENT_TYPE.FETCH,
    EVENT_TYPE.XHR,
  ];
  constructor(params = {} as RecordScreenOptions) {
    super(EVENT_TYPE.RECORDSCREEN);
    this.type = EVENT_TYPE.RECORDSCREEN;
    this.bindOptions(params);
  }

  bindOptions(params: RecordScreenOptions) {
    const { recordScreenTypeList, recordScreenDuration } = params;
    validateOption(recordScreenDuration, "recordScreenDuration", "number") &&
      (this.recordScreenDuration = recordScreenDuration!);
    validateOption(recordScreenTypeList, "recordScreenTypeList", "array") &&
      (this.recordScreenTypeList = recordScreenTypeList!);
  }
  core({ transportData, options }: SdkBase) {
    // 给公共配置上添加开启录屏的标识 和 录屏列表
    options.monitorRecordScreen = true;
    options.recordScreenTypeList = this.recordScreenTypeList;
    // 添加初始的recordScreenId
    _support.recordScreenId = generateUUID();
    console.log("[web-sdk] RecordScreen 插件初始化 monitorRecordScreen:", options.monitorRecordScreen, "recordScreenTypeList:", options.recordScreenTypeList);
    handleScreen(transportData, this.recordScreenDuration);
  }
  transform() {}
}
