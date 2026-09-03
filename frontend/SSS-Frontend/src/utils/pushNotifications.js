import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

const API_BASE_URL =
  "https://task-management-system-production-7694.up.railway.app";

export async function saveFcmTokenToBackend(fcmToken) {
  if (!fcmToken) return false;

  const token = localStorage.getItem("token");

  // User abhi login nahi hai.
  if (!token) {
    console.log("FCM token saved locally; backend save will happen after login.");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/fcm-token`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fcmToken,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `FCM token backend save failed: ${response.status} ${text}`
      );
    }

    console.log("FCM TOKEN SAVED TO BACKEND");
    return true;
  } catch (error) {
    console.error("FCM backend save error:", error);
    return false;
  }
}

export async function saveStoredFcmTokenAfterLogin() {
  const fcmToken = localStorage.getItem("fcmToken");

  if (!fcmToken) {
    console.log("No stored FCM token yet.");
    return false;
  }

  return saveFcmTokenToBackend(fcmToken);
}

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

  await PushNotifications.addListener("registration", async (token) => {
    console.log("FCM TOKEN:", token.value);

    localStorage.setItem("fcmToken", token.value);

    await saveFcmTokenToBackend(token.value);
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

  await PushNotifications.register();
}
