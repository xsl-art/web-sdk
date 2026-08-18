import {
  subscribeEvent,
  notify,
  transportData,
  breadcrumb,
  options,
  log,
  setupReplace,
  HandleEvents,
} from "./core/index";
import { _global, getFlag, setFlag, nativeTryCatch } from "@xyz-sdk/utils";
import { SDK_VERSION, SDK_NAME, EVENT_TYPE } from "@xyz-sdk/common";
import { InitOptions, VueInstance, ViewModel } from "@xyz-sdk/types";

function handleOptions(paramOptions: InitOptions) {
  //设置用户行为的配置项
  breadcrumb.bindOptions(paramOptions);
  //配置上报的信息
  transportData.bindOptions(paramOptions);
  //绑定其他配置项
  options.bindOptions(paramOptions);
}

function init(options: InitOptions) {
  if (!options.dsn || !options.apiKey) {
    return console.error(`web-see 缺少必须配置项：${!options.dsn ? "dsn" : "apikey"} `);
  }
  if (!("fetch" in _global) || options.disabled) return;
  //初始化配置
  handleOptions(options);
  //开启事件监听
  setupReplace();
}

// vue项目在Vue.config.errorHandler中上报错误
function install(Vue: VueInstance, options: InitOptions) {
  if (getFlag(EVENT_TYPE.VUE)) return;
  setFlag(EVENT_TYPE.VUE, true);
  const handler = Vue.config.errorHandler;
  Vue.config.errorHandler = function (err: Error, vm: ViewModel, info: string): void {
    HandleEvents.handleError(err);
    if (handler) handler.apply(null, [err, vm, info]);
  };
  init(options);
}

// react项目在ErrorBoundary中上报错误
function errorBoundary(err: Error): void {
  if (getFlag(EVENT_TYPE.REACT)) return;
  setFlag(EVENT_TYPE.REACT, true);
  HandleEvents.handleError(err);
}

function use(plugin: any, option: any) {
  const instance = new plugin(option);
  if (
    !subscribeEvent({
      callback: data => {
        instance.transform(data);
      },
      type: instance.type,
    })
  )
    return;
  nativeTryCatch(() => {
    instance.core({
      transportData,
      breadcrumb,
      options,
      notify,
    });
  });
}

export default {
  SDK_VERSION,
  SDK_NAME,
  init,
  install,
  errorBoundary,
  use,
  log,
};
