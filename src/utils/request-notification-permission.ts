export function requestNotificationPermission(): Promise<NotificationPermission> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      resolve("denied");
      return;
    }

    const request = Notification.requestPermission();
    // In Safari, it could return undefined
    if (request === undefined) {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
      return;
    }

    request.then((permission) => resolve(permission));
  });
}
