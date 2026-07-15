import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Layout.css";

import { t } from "../../i18n/translator";

import {
  FaBars,
  FaTasks,
  FaClipboardList,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaUserPlus,
  FaFileExcel,
  FaChartBar,
  FaBell,
  FaMoon,
  FaProjectDiagram,
  FaSearch,
} from "react-icons/fa";

function Layout({ title, children }) {

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const closeSearch = () => setTimeout(() => setSearchOpen(false), 150);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const handler = () => {
      // re-render by triggering state change only in case future UI needs it
    };
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);


  const parseLocalStorage = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  };

  const user = parseLocalStorage("user") || {};
  const userName = typeof user.name === "string" && user.name.trim() ? user.name : "Employee";
  const role = user.role?.roleName || "EMPLOYEE";
  const nameParts = userName.trim().split(" ");

  const navItems = [
    { labelKey: "nav.dashboard", path: "/dashboard", icon: <FaChartBar /> },
    { labelKey: "nav.task", path: "/task", icon: <FaTasks /> },
    { labelKey: "nav.checklist", path: "/checklist", icon: <FaClipboardList /> },
    { labelKey: "nav.attendance", path: "/attendance", icon: <FaCalendarAlt /> },
    { labelKey: "nav.calendar", path: "/calendar", icon: <FaCalendarAlt /> },
    { labelKey: "nav.projects", path: "/projects", icon: <FaProjectDiagram /> },
    { labelKey: "nav.team", path: "/team", icon: <FaUsers /> },
    { labelKey: "nav.reports", path: "/reports", icon: <FaChartBar /> },
    { labelKey: "nav.profile", path: "/profile", icon: <FaUser /> },
    { labelKey: "nav.addTask", path: "/add-task", icon: <FaUserPlus /> },
    { labelKey: "nav.employees", path: "/director-dashboard?tab=employees", icon: <FaUsers />, directorOnly: true },
    { labelKey: "nav.addEmployee", path: "/director-dashboard?tab=add-employee", icon: <FaUserPlus />, directorOnly: true },
    { labelKey: "nav.uploadExcel", path: "/director-dashboard?tab=upload-excel", icon: <FaFileExcel />, directorOnly: true },
  ];

  const isDirector = role === "DIRECTOR" || role === "director";

  const filteredNavItems = navItems.filter((item) => {
    if (item.directorOnly) return isDirector || role === "Owner/Admin";
    if (role === "Owner/Admin" || isDirector) return true;
    if (role === "Manager/Supervisor") {
      return [
        "/dashboard",
        "/add-task",
        "/task",
        "/checklist",
        "/attendance",
        "/reports",
        "/team",
        "/calendar",
        "/projects",
      ].includes(item.path);
    }
    return ["/dashboard", "/add-task", "/task", "/checklist", "/attendance", "/profile"].includes(item.path);
  });

  const searchResults = searchQuery.trim()
    ? filteredNavItems.filter((item) => t(item.labelKey).toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "E";

  return (
    <div className={`app-layout ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <aside className={`layout-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="logo-box">
          <img src="/logo.png" alt="SSS Logo" className="logo" />
          <div className="logo-text">
            <h2>SSS FMS Facility</h2>
            <p>Services</p>
          </div>
        </div>

        <nav className="sidebar-menu" onClick={closeSidebar}>
          {filteredNavItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.icon} {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div>
            <h4>{userName}</h4>
            <p>{role}</p>
          </div>
        </div>
      </aside>

      <div className={`layout-overlay ${isSidebarOpen ? "visible" : ""}`} onClick={closeSidebar} />

      <main className="layout-main-content">
        <header className="topbar">
          <button
            className="mobile-menu-btn"
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>

          <h1>{title}</h1>


          <div className="top-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={t("top.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={closeSearch}
              />
              {searchOpen && (
                <div className="search-dropdown">
                  {searchQuery.trim().length === 0 ? (
                    <div className="search-empty">{t("top.searchTypeToSearch")}</div>

                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        className="search-result"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          navigate(item.path);
                          setSearchQuery("");
                          setSearchOpen(false);
                        }}
                      >
                        <span className="search-result-icon">{item.icon}</span>
                        {t(item.labelKey)}

                      </button>
                    ))
                  ) : (
                    <div className="search-empty">{t("top.searchNoResults")}</div>
                  )}

                </div>
              )}
            </div>

            <div className="notification-box">
              <button onClick={() => setShowNotifications(!showNotifications)}>
                <FaBell />
              </button>
                  {showNotifications && (
                <div className="notification-dropdown">
                  <h4>{t("top.notifications")}</h4>
                  <p>{t("top.notif.checklistUpdated")}</p>
                  <p>{t("top.notif.tasksPending5")}</p>
                  <p>{t("top.notif.attendanceReady")}</p>
                </div>
              )}

            </div>

            <button
              type="button"
              className={darkMode ? "dark-toggle active" : "dark-toggle"}
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Toggle dark mode"
            >
              <FaMoon />
            </button>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

export default Layout;

