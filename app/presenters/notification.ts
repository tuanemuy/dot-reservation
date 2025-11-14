import { toast } from "sonner";

export type Notification = {
  info?: (message: string) => void;
  success?: (message: string) => void;
  err?: (message: string, error: unknown) => void;
};

export type CreateNotificationOptions<T = undefined> = {
  info?: (message: string) => void;
  success?: (message: string, result?: T) => void;
  err?: (message: string, error?: unknown) => void;
};

export const defaultNotification = {
  info: (message: string) => toast(message),
  success: (message: string) => toast.success(message),
  err: (message: string) => toast.error(message),
};

export function createNotification<T = undefined>({
  info,
  success,
  err,
}: CreateNotificationOptions<T> = {}) {
  return {
    info: (message: string) => {
      info ? info(message) : defaultNotification.info(message);
    },
    success: (message: string, result?: T) => {
      success ? success(message, result) : defaultNotification.success(message);
    },
    err: (message: string, error?: unknown) => {
      err ? err(message, error) : defaultNotification.err(message);
    },
  };
}
