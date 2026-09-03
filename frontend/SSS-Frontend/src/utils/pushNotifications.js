import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

export async function setupPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  let permission = await PushNotifications.checkPermissions();

  if (permission.receive !== "granted") {
    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive !== "granted") {
    console.warn("Push notification permission denied");
    return;
  }

  await PushNotifications.register();

  await PushNotifications.addListener("registration", (token) => {
    console.log("FCM TOKEN:", token.value);
    localStorage.setItem("fcmToken", token.value);
  });

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("FCM registration error:", error);
  });

  await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log("PUSH RECEIVED:", notification);
    }
  );

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      console.log("PUSH CLICKED:", action);
    }
  );
}
