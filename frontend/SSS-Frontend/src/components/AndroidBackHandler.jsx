import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

function AndroidBackHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle;

    const setupBackButton = async () => {
      listenerHandle = await CapacitorApp.addListener(
        "backButton",
        ({ canGoBack }) => {
          console.log("ANDROID BACK:", { canGoBack });

          // Actual browser / React history me previous screen hai
          if (canGoBack) {
            window.history.back();
            return;
          }

          // History khatam hone ke baad hi app exit
          CapacitorApp.exitApp();
        }
      );
    };

    setupBackButton();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return null;
}

export default AndroidBackHandler;
