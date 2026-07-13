import { INTERFACE_STATUS } from "@websdk/common";

export function fromHttpStatus(httpStatus: any) {
  if (httpStatus < 400) {
    return INTERFACE_STATUS.OK;
  }
  if (httpStatus >= 400 && httpStatus < 500) {
    switch (httpStatus) {
      case 401:
        return INTERFACE_STATUS.Unauthenticated;
      case 403:
        return INTERFACE_STATUS.PermissionDenied;
      case 404:
        return INTERFACE_STATUS.NotFound;
      case 409:
        return INTERFACE_STATUS.AlreadyExists;
      case 413:
        return INTERFACE_STATUS.FailedPrecondition;
      case 429:
        return INTERFACE_STATUS.ResourceExhausted;
      default:
        return INTERFACE_STATUS.InvalidArgument;
    }
  }
  if (httpStatus >= 500 && httpStatus < 600) {
    switch (httpStatus) {
      case 501:
        return INTERFACE_STATUS.Unimplemented;
      case 503:
        return INTERFACE_STATUS.Unavailable;
      case 504:
        return INTERFACE_STATUS.DeadlineExceeded;
      default:
        return INTERFACE_STATUS.InternalError;
    }
  }
  return INTERFACE_STATUS.UnknownError;
}
