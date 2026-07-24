import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Layout.css";

import LanguageSelector from "../LanguageSelector";
import BackButton from "../BackButton/BackButton";


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
  FaHome,
  FaPlus,
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

  const parseLocalStorage = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  };

const user = parseLocalStorage("user") || {};
  const userName = typeof user.name === "string" && user.name.trim() ? user.name : "Employee";
  const roleRaw = user?.roleName || user?.role?.roleName || "EMPLOYEE";
  const role = String(roleRaw).toUpperCase();
  const nameParts = userName.trim().split(" ");

const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { label: "My Tasks", path: "/task", icon: <FaTasks /> },
    { label: "Checklist", path: "/checklist", icon: <FaClipboardList /> },
    { label: "Attendance", path: "/attendance", icon: <FaCalendarAlt /> },
    { label: "Calendar", path: "/calendar", icon: <FaCalendarAlt /> },
    { label: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
    { label: "Team", path: "/team", icon: <FaUsers /> },
    { label: "Reports", path: "/reports", icon: <FaChartBar /> },
    { label: "Add Task", path: "/add-task", icon: <FaPlus /> },
    { label: "Notifications", path: "/notifications", icon: <FaBell /> },
    { label: "Profile", path: "/profile", icon: <FaUser /> },
    { label: "Employees", path: "/director-dashboard?tab=employees", icon: <FaUsers />, directorOnly: true },
    { label: "Add Employee", path: "/director-dashboard?tab=add-employee", icon: <FaUserPlus />, directorOnly: true },
    { label: "Upload Excel", path: "/director-dashboard?tab=upload-excel", icon: <FaFileExcel />, directorOnly: true },
  ];

  const isDirector = role === "DIRECTOR";

  const filteredNavItems = navItems.filter((item) => {
    if (item.directorOnly) return isDirector || role === "OWNER/ADMIN";
    if (isDirector || role === "OWNER/ADMIN") return true;
    if (role === "SUPERVISOR") return ["/dashboard", "/task", "/checklist", "/attendance", "/reports", "/team", "/calendar", "/projects"].includes(item.path);
    if (role === "EMPLOYEE") return ["/dashboard", "/task", "/add-task", "/attendance", "/calendar", "/reports", "/notifications", "/profile"].includes(item.path);
    return false;
  });

  const searchResults = searchQuery.trim()
    ? filteredNavItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
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
              {item.icon} {item.label}
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

      <div
        className={`layout-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      />

      <main className="layout-main-content">
        <header className="topbar">
          <div style={{ display: 'none' }}>{title}</div>
          <div className="mobile-navigation-controls">
            <button
              className="mobile-menu-btn"
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <FaBars />
            </button>

            <BackButton />
          </div>

          <h1>{title}</h1>

          <div className="top-actions">
            <LanguageSelector />
            <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search anything..."
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
                  <div className="search-empty">Type to search pages</div>
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
                      {item.label}
                    </button>
                  ))
                ) : (
                  <div className="search-empty">No results found</div>
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
                  <h4>Notifications</h4>
                  <p>? Checklist Updated</p>
                  <p>? 5 Tasks Pending</p>
                  <p>?? Attendance Report Ready</p>
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
