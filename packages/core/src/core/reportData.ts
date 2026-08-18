import {
  _support,
  validateOption,
  isBrowserEnv,
  Queue,
  TokenBucket,
  isSampledHit,
  isEmpty,
  getLocationHref,
  getTimestamp,
  generateUUID,
  offlineReportCache,
  _global,
} from "@xyz-sdk/utils";
import { SDK_VERSION, EVENT_TYPE } from "@xyz-sdk/common";
import { ReportData, InitOptions, OfflineReportData } from "@xyz-sdk/types";
import { breadcrumb } from "./breadcrumb";

/**
 * 上报数据
 */
export class TransportData {
  queue: Queue = new Queue(); //消息队列
  apiKey = ""; //项目标识符
  errorDsn = ""; //监控上报接口的地址
  userId = "";
  release = "";
  uuid: string; //每次页面加载的唯一标识符
  beforeDataReport: any;
  getUserId: any; //用户自定义获取userID的方法
  useImgUpload = false;
  offlineCache = true;
  offlineCacheMaxSize = 50;
  offlineCacheExpireTime = 24 * 60 * 60 * 1000;
  offlineRetryDelay = 3000;
  sampleRate = 1; // 全部上报
  sampleRateByType: { [eventType: string]: number } = {};
  rateLimitPerMinute = 0; // 无限制
  aggregateErrors = false;
  aggregateInterval = 10000;
  batchReport = false;
  batchSize = 10;
  batchInterval = 5000;
  private rateLimiter: TokenBucket | null = null; //令牌桶限流器
  private aggregateMap = new Map<string, { data: ReportData; count: number }>(); //错误聚合映射
  private aggregateTimer: number | null = null; //错误聚合定时器
  private batchBuffer: ReportData[] = []; //批量上报数据缓冲区
  private batchTimer: number | null = null;
  private lifecycleListenerRegistered = false; //是否注册了生命周期监听器
  private isFlushingOffline = false; //是否正在刷新离线数据
  private isOnlineListenerRegistered = false; //是否注册了在线监听器
  constructor() {
    this.uuid = generateUUID();
  }

  beacon(url: string, data: any): boolean {
    // 使用 Blob 指定 application/json，确保后端 body-parser 能正确解析
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    return navigator.sendBeacon(url, blob);
  }

  imgRequest(data: ReportData, url: string): void {
    const requestFun = () => {
      const img = new Image();
      const spliceStr = url.indexOf("?") === -1 ? "?" : "&";
      img.src = `${url}${spliceStr}data=${encodeURIComponent(JSON.stringify(data))}`;
    };
    this.queue.addFn(requestFun);
  }

  async beforePost(this: any, data: ReportData): Promise<ReportData | boolean> {
    let transportData = this.getTransportData(data); //获取完整的上报数据
    if (typeof this.beforeDataReport === "function") {
      transportData = this.beforeDataReport(transportData);
      if (!transportData) return false;
    }
    return transportData;
  }

  async xhrPost(data: ReportData, url: string): Promise<void> {
    const requestFun = () => {
      fetch(`${url}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    };
    this.queue.addFn(requestFun);
  }

  private async post(data: any, url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private isOnline(): boolean {
    if (!isBrowserEnv || typeof navigator === "undefined") return false;
    return navigator.onLine !== false;
  }

  private async cacheReport(data: ReportData, dsn: string): Promise<void> {
    if (!this.offlineCache) return;
    await offlineReportCache.add({
      data,
      dsn,
      createdAt: getTimestamp(),
      retryCount: 0,
    });
    await offlineReportCache.clearExpired(this.offlineCacheExpireTime);
    await offlineReportCache.trimToMaxSize(this.offlineCacheMaxSize);
  }

  /** 设置离线重试 */
  private setupOfflineRetry(): void {
    if (!isBrowserEnv || !this.offlineCache) return;
    if (!this.isOnlineListenerRegistered) {
      this.isOnlineListenerRegistered = true;
      _global.addEventListener("online", () => {
        window.setTimeout(() => {
          this.flushOfflineReports();
        }, this.offlineRetryDelay);
      });
    }
    window.setTimeout(() => {
      this.flushOfflineReports();
    }, this.offlineRetryDelay);
  }

  /** 刷新离线数据 */
  async flushOfflineReports(): Promise<void> {
    if (!this.offlineCache || this.isFlushingOffline || !this.isOnline()) return;
    this.isFlushingOffline = true;
    try {
      await offlineReportCache.clearExpired(this.offlineCacheExpireTime);
      await offlineReportCache.trimToMaxSize(this.offlineCacheMaxSize);
      const records = await offlineReportCache.list();
      for (const record of records) {
        const success = await this.post(record.data, record.dsn);
        if (success && record.id !== undefined) {
          await offlineReportCache.remove(record.id);
        } else {
          await this.updateRetryCount(record);
          break;
        }
      }
    } finally {
      this.isFlushingOffline = false;
    }
  }

  private async updateRetryCount(record: OfflineReportData): Promise<void> {
    if (record.id === undefined) return;
    await offlineReportCache.update({
      ...record,
      retryCount: record.retryCount + 1,
    });
  }

  getAuthInfo(): any {
    return {
      userId: this.userId || this.getAuthId() || "",
      sdkVersion: SDK_VERSION,
      apiKey: this.apiKey,
      release: this.release,
    };
  }

  getAuthId(): string | number {
    //用户自定义获取userID的方法
    if (typeof this.getUserId === "function") {
      const id = this.getUserId();
      if (typeof id === "string" || typeof id === "number") {
        return id;
      } else {
        console.error(`web-sdk userId: ${id} 期望 string 或 number 类型，但是传入 ${typeof id}`);
      }
    }
    return "";
  }

  //添加公共信息
  getTransportData(data: any): ReportData {
    const info = {
      ...data,
      ...this.getAuthInfo(), //获取用户信息
      uuid: this.uuid,
      pageUrl: getLocationHref(),
      deviceInfo: _support.deviceInfo,
    };

    // 性能数据、录屏、白屏检测等不需要附带用户行为
    const excludeRreadcrumb = [
      EVENT_TYPE.PERFORMANCE,
      EVENT_TYPE.RECORDSCREEN,
      EVENT_TYPE.WHITESCREEN,
    ];

    if (!excludeRreadcrumb.includes(data.type)) {
      info.breadcrumb = breadcrumb.getStack(); //获取用户行为栈
    }
    return info;
  }

  //判断请求是否为sdk配置的接口
  isSdkTransportUrl(targetUrl: string): boolean {
    let isSdkDsn = false;
    if (this.errorDsn && targetUrl.indexOf(this.errorDsn) !== -1) isSdkDsn = true;
    return isSdkDsn;
  }

  bindOptions(options: InitOptions): void {
    const {
      dsn,
      apiKey,
      release,
      beforeDataReport,
      userId,
      getUserId,
      useImgUpload,
      offlineCache,
      offlineCacheMaxSize,
      offlineCacheExpireTime,
      offlineRetryDelay,
      sampleRate,
      sampleRateByType,
      rateLimitPerMinute,
      aggregateErrors,
      aggregateInterval,
      batchReport,
      batchSize,
      batchInterval,
    } = options;
    validateOption(apiKey, "apiKey", "string") && (this.apiKey = apiKey);
    validateOption(dsn, "dsn", "string") && (this.errorDsn = dsn);
    validateOption(release, "release", "string") && (this.release = release || "");
    validateOption(userId, "userId", "string") && (this.userId = userId || "");
    validateOption(useImgUpload, "useImgUpload", "boolean") &&
      (this.useImgUpload = useImgUpload || false);
    validateOption(beforeDataReport, "beforeDataReport", "function") &&
      (this.beforeDataReport = beforeDataReport);
    validateOption(getUserId, "getUserId", "function") && (this.getUserId = getUserId);
    validateOption(offlineCache, "offlineCache", "boolean") &&
      (this.offlineCache = offlineCache as boolean);
    validateOption(offlineCacheMaxSize, "offlineCacheMaxSize", "number") &&
      (this.offlineCacheMaxSize = offlineCacheMaxSize || 50);
    validateOption(offlineCacheExpireTime, "offlineCacheExpireTime", "number") &&
      (this.offlineCacheExpireTime = offlineCacheExpireTime || 24 * 60 * 60 * 1000);
    validateOption(offlineRetryDelay, "offlineRetryDelay", "number") &&
      (this.offlineRetryDelay = offlineRetryDelay || 3000);
    validateOption(sampleRate, "sampleRate", "number") &&
      (this.sampleRate = Math.min(Math.max(sampleRate as number, 0), 1));
    validateOption(sampleRateByType, "sampleRateByType", "object") &&
      (this.sampleRateByType = sampleRateByType as { [eventType: string]: number });
    if (validateOption(rateLimitPerMinute, "rateLimitPerMinute", "number")) {
      this.rateLimitPerMinute = Math.max(0, rateLimitPerMinute as number);
      this.rateLimiter =
        this.rateLimitPerMinute > 0 ? new TokenBucket(this.rateLimitPerMinute) : null;
    }
    validateOption(aggregateErrors, "aggregateErrors", "boolean") &&
      (this.aggregateErrors = aggregateErrors as boolean);
    validateOption(aggregateInterval, "aggregateInterval", "number") &&
      (this.aggregateInterval = (aggregateInterval as number) || 10000);
    validateOption(batchReport, "batchReport", "boolean") &&
      (this.batchReport = batchReport as boolean);
    validateOption(batchSize, "batchSize", "number") &&
      (this.batchSize = Math.max(1, (batchSize as number) || 10));
    validateOption(batchInterval, "batchInterval", "number") &&
      (this.batchInterval = (batchInterval as number) || 5000);
    this.registerLifecycleFlush();
    this.setupOfflineRetry();
  }

  /** 是否采样 */
  private isSampled(data: ReportData): boolean {
    const typeRate = data && data.type ? this.sampleRateByType[data.type] : undefined;
    const rate = typeof typeRate === "number" ? typeRate : this.sampleRate;
    return isSampledHit(rate);
  }

  /** 消耗令牌桶中的令牌判断是否限流 */
  private consumeRateToken(): boolean {
    if (!this.rateLimiter) return true;
    return this.rateLimiter.tryConsume();
  }

  /** 是否聚合 */
  private shouldAggregate(data: ReportData): boolean {
    if (!this.aggregateErrors || !data || !data.errorUid) return false;
    return data.type === EVENT_TYPE.ERROR || data.type === EVENT_TYPE.UNHANDLEDREJECTION;
  }

  /** 收集聚合数据 */
  private collectAggregate(data: ReportData): void {
    const uid = data.errorUid as string;
    const exist = this.aggregateMap.get(uid);
    if (exist) {
      exist.count += 1;
      exist.data.time = data.time;
      return;
    }
    this.aggregateMap.set(uid, { data, count: 0 });
    void this.deliver(data, this.errorDsn);
    this.ensureAggregateTimer();
  }

  /** 聚合定时器 */
  private ensureAggregateTimer(): void {
    if (this.aggregateTimer !== null || !isBrowserEnv) return;
    this.aggregateTimer = window.setInterval(() => {
      this.flushAggregates();
    }, this.aggregateInterval);
  }

  /** 上报聚合数据 */
  flushAggregates(): void {
    if (this.aggregateMap.size === 0) return;
    this.aggregateMap.forEach(entry => {
      if (entry.count <= 0) return;
      const aggregated: ReportData = {
        ...entry.data,
        count: entry.count,
        isAggregate: true,
      };
      entry.count = 0;
      void this.deliver(aggregated, this.errorDsn);
    });
  }

  private pushBatch(data: ReportData): void {
    this.batchBuffer.push(data);
    this.ensureBatchTimer();
    if (this.batchBuffer.length >= this.batchSize) {
      void this.flushBatch();
    }
  }

  private ensureBatchTimer(): void {
    if (this.batchTimer !== null || !isBrowserEnv) return;
    this.batchTimer = window.setInterval(() => {
      void this.flushBatch();
    }, this.batchInterval);
  }

  /** 上报批量数据 */
  async flushBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) return;
    const list = this.batchBuffer.splice(0, this.batchBuffer.length);
    const dsn = this.errorDsn;
    if (isEmpty(dsn)) return;
    if (!this.isOnline()) {
      for (const item of list) {
        await this.cacheReport(item, dsn);
      }
      return;
    }
    if (!this.consumeRateToken()) {
      // 令牌不足，缓存数据
      this.batchBuffer = list.concat(this.batchBuffer);
      return;
    }
    const payload = { batch: true as const, apiKey: this.apiKey, list };
    const ok = this.beacon(dsn, payload) || (await this.post(payload, dsn));
    if (!ok) {
      for (const item of list) {
        await this.cacheReport(item, dsn);
      }
    }
  }

  /** 注册生命周期事件
   * 当页面关闭时，上报聚合数据和批量数据
   */
  private registerLifecycleFlush(): void {
    if (!isBrowserEnv || this.lifecycleListenerRegistered) return;
    if (!this.batchReport && !this.aggregateErrors) return;
    this.lifecycleListenerRegistered = true;
    _global.addEventListener("pagehide", () => {
      this.flushOnExit();
    });
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") this.flushOnExit();
      });
    }
  }

  private flushOnExit(): void {
    this.flushAggregates();
    void this.flushBatch();
  }

  //上报数据
  async send(data: ReportData) {
    const dsn = this.errorDsn;
    if (isEmpty(dsn)) {
      console.error("web-sdk: dsn为空，没有传入监控错误上报的dsn地址，请在init中传入");
      return;
    }
    //开启录屏，由@xyz-sdk/recordScreen 插件控制
    if (_support.options?.monitorRecordScreen) {
      if (_support.options.recordScreenTypeList?.includes(data.type)) {
        //修改hasError
        _support.hasError = true;
        data.recordScreenId = _support.recordScreenId;
        console.log(
          "[web-sdk] 触发录屏标记 type:",
          data.type,
          "recordScreenId:",
          data.recordScreenId,
        );
      }
    }
    if (!this.isSampled(data)) return;
    const result = (await this.beforePost(data)) as ReportData;
    if (isBrowserEnv && result) {
      if (this.shouldAggregate(result)) {
        this.collectAggregate(result);
        return;
      }
      if (this.batchReport) {
        this.pushBatch(result);
        return;
      }
      await this.deliver(result, dsn);
    }
  }

  /** 上报数据 */
  private async deliver(result: ReportData, dsn: string): Promise<void> {
    if (!this.isOnline()) {
      await this.cacheReport(result, dsn);
      return;
    }
    //优先使用sendBeacon
    if (!this.consumeRateToken()) return;
    const value = this.beacon(dsn, result);
    if (value) return;
    if (this.useImgUpload) {
      return this.imgRequest(result, dsn);
    }
    const success = await this.post(result, dsn);
    if (!success) await this.cacheReport(result, dsn);
  }
}

const transportData = _support.transportData || (_support.transportData = new TransportData());
export { transportData };