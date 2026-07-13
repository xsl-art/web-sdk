/**try函数 */
export function nativeTryCatch(fn: any, errorFn?: any): void {
  try {
    fn();
  } catch (e) {
    if (errorFn) {
      errorFn(e);
    }
  }
}
