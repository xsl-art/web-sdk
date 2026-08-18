/**
 * 令牌桶限流器
 * 采样决策辅助函数
 */
export class TokenBucket {
  private capacity: number; //每分钟允许上报的事件数量
  private tokens: number; //当前令牌桶中的令牌数量
  private lastRefill: number; //上次填充时间戳
  private readonly refillPerMs: number; //每毫秒填充的令牌数量=this.capacity / 60000

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.refillPerMs = this.capacity / 60000;
  }

  /** 填充令牌桶 */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefill = now;
  }

  /** 消耗一个令牌，返回令牌是否足够
   * @returns 如果令牌足够，返回true，否则返回false限流
   */
  tryConsume(): boolean {
    this.refill();
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/** 随机采样*/
export function isSampledHit(rate: number): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate; //随机采样，返回true表示采样到
}
