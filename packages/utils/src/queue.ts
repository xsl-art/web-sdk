//上报队列
import { _global } from "./global";
import { voidFun } from "@websdk/types";

export class Queue {
  private stack: any[] = [];
  private isFlushing = false; // 标记是否正在批量处理中
  constructor() {}
  addFn(fn: voidFun): void {
    if (typeof fn !== "function") return;
    if (!("requestIdleCallback" in _global || "Promise" in _global)) {
      fn();
      return;
    }
    this.stack.push(fn);
    if (!this.isFlushing) {
      this.isFlushing = true;
      //优先使用requestIdleCallback
      if ("requestIdleCallback" in _global) {
        requestIdleCallback(() => this.flushStack());
      } else {
        //其次微任务上报
        Promise.resolve().then(() => this.flushStack());
      }
    }
  }
  clear() {
    this.stack = [];
  }
  getStack() {
    return this.stack;
  }
  flushStack(): void {
    const temp = this.stack.slice(0);
    this.stack = []; // 清空队列，避免重复处理
    this.isFlushing = false;
    for (let i = 0; i < temp.length; i++) {
      temp[i]();
    }
  }
}
