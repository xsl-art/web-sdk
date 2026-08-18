import { getWebVitals, getResource } from "./core/performance";
import { SdkBase, BasePlugin } from "@xyz-sdk/types";
import { EVENT_TYPE, STATUS_CODE } from "@xyz-sdk/common";
import { getTimestamp, _global, on } from "@xyz-sdk/utils";

export default class WebPerformance extends BasePlugin {
  type: string;
  constructor() {
    super(EVENT_TYPE.PERFORMANCE);
    this.type = EVENT_TYPE.PERFORMANCE;
  }
  bindOptions() {}
  core({ transportData }: SdkBase) {
    //获取FCP、LCP、TTFP、FID等指标
    getWebVitals((res: any) => {
      // name指标名称、rating 评级、value数值
      const { name, rating, value } = res;
      transportData.send({
        type: EVENT_TYPE.PERFORMANCE,
        status: STATUS_CODE.OK,
        timestamp: getTimestamp(),
        name,
        rating,
        value,
      });
    });

    const observer = new PerformanceObserver(list => {
      for (const long of list.getEntries()) {
        //上报长任务详情
        transportData.send({
          type: EVENT_TYPE.PERFORMANCE,
          name: "longTask",
          longTask: long,
          time: getTimestamp(),
          status: STATUS_CODE.OK,
        });
      }
    });
    observer.observe({ entryTypes: ["longtask"] });

    on(_global, "load", function () {
      //上报资源列表
      transportData.send({
        type: EVENT_TYPE.PERFORMANCE,
        name: "resourceList",
        time: getTimestamp(),
        status: STATUS_CODE.OK,
        resourceList: getResource(),
      });

      // 上报内存情况, safari、firefox不支持该属性
      if (performance.memory) {
        transportData.send({
          type: EVENT_TYPE.PERFORMANCE,
          name: "memory",
          time: getTimestamp(),
          status: STATUS_CODE.OK,
          memory: {
            jsHeapSizeLimit: performance.memory && performance.memory.jsHeapSizeLimit,
            totalJsHeapSize: performance.memory && performance.memory.totalJsHeapSize,
            usedJsHeapSize: performance.memory && performance.memory.usedJsHeapSize,
          },
        });
      }
    });
  }
  transform() {}
}
