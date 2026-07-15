/**接口错误状态 */
export enum INTERFACE_STATUS {
  OK = "ok",
  DeadlineExceeded = "deadline_exceeded", //超时
  Unauthenticated = "unauthenticated", //缺乏认证
  PermissionDenied = "permission_denied",
  NotFound = "not_found",
  ResourceExhausted = "resource_exhausted", //资源耗尽
  InvalidArgument = "invalid_argument",
  Unimplemented = "unimplemented",
  Unavailable = "unavailable", //不可用
  InternalError = "internal_error", //内部错误
  UnknownError = "unknown_error",
  Cancelled = "cancelled",
  AlreadyExists = "already_exists",
  FailedPrecondition = "failed_precondition", //前置条件失败
  Aborted = "aborted",
  OutOfRange = "out_of_range",
  DataLoss = "data_loss",
}

/**用户行为 */
export enum USER_ACTION {
  HTTP = "Http",
  CLICK = "Click",
  RESOURCE = "ResourceError",
  CODEERROR = "CodeError",
  ROUTER = "Router",
  CUSTOM = "Custom",
}

export enum STATUS_CODE {
  ERROR = "error",
  OK = "ok",
}

/**事件类型 */
export enum EVENT_TYPE {
  XHR = "xhr",
  FETCH = "fetch",
  CLICK = "click",
  HISTORY = "history",
  ERROR = "error",
  HASHCHANGE = "hashChange",
  UNHANDLEDREJECTION = "unhandledRejection",
  RESOURCE = "resource",
  DOM = "dom",
  VUE = "vue",
  REACT = "react",
  CUSTOM = "custom",
  PERFORMANCE = "performance",
  RECORDSCREEN = "recordScreen",
  WHITESCREEN = "whiteScreen",
}

export enum HTTPTYPE {
  XHR = "xhr",
  FETCH = "fetch",
}

export enum HTTP_CODE {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
}

export enum METHOD {
  Get = "get",
  Post = "post",
  Put = "put",
  Delete = "delete",
}
