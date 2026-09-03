import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AndroidBackHandler from "./components/AndroidBackHandler";
import { setupPushNotifications } from "./utils/pushNotifications";
import App from "./App.jsx";
import "./index.css";

setupPushNotifications().catch((error) => console.error("Push setup failed:", error));

// Initialize i18next
import "./i18n/i18n.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AndroidBackHandler />
    <App />
  </BrowserRouter>
);
