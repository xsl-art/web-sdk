import { on, _global } from "@xyz-sdk/utils";
import { Callback } from "@xyz-sdk/types";
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

// firstScreenPaint为首屏加载时间
let firstScreenPaint = 0;
//页面是否渲染完成
let isOnLoaded = false;
let timer: number;
let observer: MutationObserver;
let entries: any[] = []; //存储首屏渲染过程中DOM 变化的事件记录

// 定时器循环监听dom的变化，当document.readyState === 'complete'时，停止监听
function checkDOMChange(callback: Callback) {
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(() => {
    if (document.readyState === "complete") {
      isOnLoaded = true;
    }
    if (isOnLoaded) {
      //取消监听
      observer && observer.disconnect();
      //计算首屏渲染时间
      firstScreenPaint = getRenderTime();
      entries = [];
      callback && callback(firstScreenPaint);
    } else {
      checkDOMChange(callback);
    }
  });
}

function getRenderTime(): number {
  let startTime = 0;
  entries.forEach(entry => {
    if (entry.startTime > startTime) {
      startTime = entry.startTime;
    }
  });
  // performance.timing.navigationStart 页面的起始时间
  return startTime - performance.timing.navigationStart;
}

const viewportWidth = _global.innerWidth;
const viewportHeight = _global.innerHeight;

//dom对象是否在屏幕内
function isInScreen(dom: HTMLElement): boolean {
  const rectInfo = dom.getBoundingClientRect();
  if (rectInfo.left < viewportWidth && rectInfo.top < viewportHeight) return true;
  return false;
}

function getFirstScreenPaint(callback: Callback) {
  if ("requestIdCallback" in _global) {
    requestIdleCallback(deadline => {
      // timeRemaining：表示当前空闲时间的剩余时间
      // 如果剩余时间大于0，说明当前空闲时间还没有到，继续监听
      if (deadline.timeRemaining() > 0) {
        observerFirstScreenPaint(callback);
      }
    });
  } else {
    observerFirstScreenPaint(callback);
  }
}

// 外部通过callback 拿到首屏加载时间
export function observerFirstScreenPaint(callback: Callback): void {
  const ignoreDOMList = ["STYLE", "SCRIPT", "LINK"];
  observer = new MutationObserver((mutationList: any) => {
    checkDOMChange(callback);
    //存储变化的元素和变化的时间戳
    const entry = { children: [], startTime: 0 };
    for (const mutation of mutationList) {
      // 只记录新增的节点
      if (mutation.addedNodes.length && isInScreen(mutation.target as HTMLElement)) {
        for (const node of mutation.addedNodes) {
          // nodeType === 1    只取元素节点（排除文本、注释）
          if (node.nodeType === 1 && !ignoreDOMList.includes(node.tagName) && isInScreen(node)) {
            entry.children.push(node as never);
          }
        }
      }
    }
    if (entry.children.length) {
      entries.push(entry);
      entry.startTime = new Date().getTime();
    }
  });
  observer.observe(document, {
    childList: true, // 监听添加或删除子节点
    subtree: true, // 监听整个子树
    characterData: true, // 监听元素的文本是否变化
    attributes: true, // 监听元素的属性是否变化
  });
}

export function isSafari(): boolean {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}

/**
 * 获取首屏加载的静态资源
 * @returns 静态资源列表
 */
export function getResource(): PerformanceResourceTiming[] {
  const entries = performance.getEntriesByType("resource");
  //过滤掉非静态资源的fetch,xmlhttprequest,beacon
  let list = entries.filter(entry => {
    return ["fetch", "xmlhttprequest", "beacon"].indexOf(entry.initiatorType) === -1;
  });

  if (list.length) {
    list = JSON.parse(JSON.stringify(list));
    list.forEach((entry: any) => {
      entry.isCache = isCache(entry);
    });
  }
  return list;
}

//是否来自缓存
export function isCache(entry: PerformanceResourceTiming): boolean {
  //transferSize === 0 表示强缓存命中
  //encodedBodySize === 0 表示协商缓存命中
  return entry.transferSize === 0 || (entry.transferSize !== 0 && entry.encodedBodySize === 0);
}

export function getFCP(callback: Callback) {
  const entryHandler = (list: any) => {
    //获取性能条目
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        observer.disconnect();
        callback({
          name: "FCP",
          value: entry.startTime,
          rating: entry.startTime > 2500 ? "poor" : "good",
        });
      }
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  //监听paint事件 包含已发生的paint事件
  observer.observe({ type: "paint", buffered: true });
}

export function getLCP(callback: Callback): void {
  const entryHandler = (list: any) => {
    for (const entry of list.getEntries()) {
      observer.disconnect();
      callback({
        name: "LCP",
        value: entry.startTime,
        rating: entry.startTime > 2500 ? "poor" : "good",
      });
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "largest-contentful-paint", buffered: true });
}

//首次交互响应时间
export function getFID(callback: Callback): void {
  const entryHandler = (entryList: any) => {
    for (const entry of entryList.getEntries()) {
      observer.disconnect();
      //首次交互响应时间 = 浏览器开始处理时间 - 输入时间
      const value = entry.processingStart - entry.startTime;
      callback({
        name: "FID",
        value,
        rating: value > 100 ? "poor" : "good",
      });
    }
  };
  const observer = new PerformanceObserver(entryHandler);
  //buffered: true 表示即使观察器创建之前发生了首次输入，
  // 也能从性能缓冲区中获取到首次输入事件的性能条目
  observer.observe({ type: "first-input", buffered: true });
}

//累积布局偏移量
export function getCLS(callback: Callback): void {
  let clsValue = 0; //最终的累积布局偏移量
  let sessionValue = 0; //当前会话的累积布局偏移量
  let sessionEntries: LayoutShift[] = []; //当前会话的布局偏移量条目

  const entryHandler = (entryList: any) => {
    for (const entry of entryList.getEntries()) {
      // 忽略用户输入后的偏移量
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        // 如果条目与上一条目的相隔时间小于 1 秒
        // 与且会话中第一个条目的相隔时间小于 5 秒，
        //  那么将条目包含在当前会话中。否则，开始一个新会话。
        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }

        // 取最大会话值作为 CLS
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          observer.disconnect();

          callback({
            name: "CLS",
            value: clsValue,
            rating: clsValue > 0.25 ? "poor" : "good",
          });
        }
      }
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: "layout-shift", buffered: true });
}

//首字节加载时间
export function getTTFB(callback: Callback): void {
  on(_global, "load", function () {
    // 首字节加载时间 = 浏览器收到服务器第一个字节的时间 - 浏览器开始加载页面的时间
    const { responseStart, navigationStart } = _global.performance.timing;
    const value = responseStart - navigationStart;
    callback({
      name: "TTFB",
      value,
      rating: value > 100 ? "poor" : "good",
    });
  });
}

export function getWebVitals(callback: Callback): void {
  // web-vitals 不兼容safari浏览器
  if (isSafari()) {
    getFID(res => {
      callback(res);
    });
    getFCP(res => {
      callback(res);
    });
    getLCP(res => {
      callback(res);
    });
    getCLS(res => {
      callback(res);
    });
    getTTFB(res => {
      callback(res);
    });
  } else {
    onLCP(res => {
      callback(res);
    });
    onINP(res => {
      callback(res);
    });
    onCLS(res => {
      callback(res);
    });
    onFCP(res => {
      callback(res);
    });
    onTTFB(res => {
      callback(res);
    });
  }

  //首屏加载时间
  getFirstScreenPaint(res => {
    const data = {
      name: "FSP",
      value: res,
      rating: res > 2500 ? "poor" : "good",
    };
    callback(data);
  });
}
