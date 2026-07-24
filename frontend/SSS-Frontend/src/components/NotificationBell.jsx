import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBell } from "react-icons/fa";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getUserId = () => {
    try {
      const loggedUser = JSON.parse(localStorage.getItem("user"));
      console.log("Logged user:", loggedUser);
      const userId = loggedUser?.id || null;
      console.log("Notification userId:", userId);
      return userId;
    } catch {
      return null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      console.log("Notification fetch skipped: no userId found");
      return;
    }

    try {
      // Fetch unread count
      const countResponse = await fetch(
        `http://localhost:8080/api/notifications/user/${userId}/unread-count`
      );
      if (countResponse.ok) {
        const count = await countResponse.json();
        console.log("Unread count response:", count);
        if (typeof count === "number") {
          setUnreadCount(count);
        } else if (count && typeof count === "object" && count.data !== undefined) {
          setUnreadCount(Number(count.data));
        }
      } else {
        console.log("Failed to fetch unread count, status:", countResponse.status);
      }
    } catch (err) {
      console.log("Failed to fetch unread count:", err);
    }

    try {
      // Fetch notifications list
      const listResponse = await fetch(
        `http://localhost:8080/api/notifications/user/${userId}`
      );
      console.log("Notification API response status:", listResponse.status);
      if (listResponse.ok) {
        const data = await listResponse.json();
        console.log("Notification API response:", data);
        // Handle both direct array and response.data wrapping
        let list = null;
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (data && Array.isArray(data.content)) {
          list = data.content;
        }
        if (list !== null) {
          console.log("Setting notifications count:", list.length);
          setNotifications(list);
        }
      } else {
        console.log("Failed to fetch notifications list, status:", listResponse.status);
      }
    } catch (err) {
      // Do NOT replace notifications with empty array on error — keep existing state
      console.log("Failed to fetch notifications list:", err);
    }
  }, [getUserId]);

  // Auto-refresh every 15 seconds, also listen for manual refresh event
  useEffect(() => {
    console.log("NotificationBell mounted, fetching initial notifications");
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    const handleRefresh = () => {
      console.log("Notification refresh triggered by event");
      fetchNotifications();
    };
    window.addEventListener("notificationRefresh", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notificationRefresh", handleRefresh);
    };
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await fetch(
          `http://localhost:8080/api/notifications/${notification.id}/read`,
          { method: "PUT" }
        );
        fetchNotifications();
      } catch (err) {
        console.log("Failed to mark notification as read:", err);
      }
    }

    setShowDropdown(false);

    if (notification.taskId) {
      navigate(`/tasks/${notification.taskId}`);
    } else {
      navigate("/tasks");
    }
  };

  const handleMarkAllAsRead = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      await fetch(
        `http://localhost:8080/api/notifications/user/${userId}/read-all`,
        { method: "PUT" }
      );
      fetchNotifications();
    } catch (err) {
      console.log("Failed to mark all as read:", err);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="notification-box" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => {
          setShowDropdown(!showDropdown);
          fetchNotifications();
        }}
        aria-label={t("common.notifications")}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>{t("layout.notifications.title")}</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                {t("layout.notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">
                {t("layout.notifications.noNotifications")}
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.read ? "notification-unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-title">
                    {notification.title}
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {formatDateTime(notification.createdAt || notification.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

