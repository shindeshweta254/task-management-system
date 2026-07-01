import { NavLink } from "react-router-dom";
import { useState } from "react";
import "./Layout.css";

import {
  FaTasks,
  FaClipboardList,
  FaCalendarAlt,
  FaUser,
  FaUsers,
  FaChartBar,
  FaBell,
  FaMoon,
  FaProjectDiagram,
} from "react-icons/fa";

function Layout({ title, children }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo-box">
          <div className="logo">S</div>
          <div className="logo-text">
            <h2>SSS Facility</h2>
            <p>Services</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <NavLink to="/dashboard"><FaChartBar /> Dashboard</NavLink>
          <NavLink to="/tasks"><FaTasks /> Tasks</NavLink>
          <NavLink to="/checklist"><FaClipboardList /> Checklist</NavLink>
          <NavLink to="/attendance"><FaCalendarAlt /> Attendance</NavLink>
          <NavLink to="/calendar"><FaCalendarAlt /> Calendar</NavLink>
          <NavLink to="/projects"><FaProjectDiagram /> Projects</NavLink>
          <NavLink to="/team"><FaUsers /> Team</NavLink>
          <NavLink to="/reports"><FaChartBar /> Reports</NavLink>
          <NavLink to="/profile"><FaUser /> Profile</NavLink>
        </nav>

        <div className="user-card">
          <div className="user-avatar">H</div>
          <div>
            <h4>Harsh Sharma</h4>
            <p>Admin</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>{title}</h1>

          <div className="top-actions">
            <input type="text" placeholder="Search anything..." />

            <div className="notification-box">
              <button onClick={() => setShowNotifications(!showNotifications)}>
                <FaBell />
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <h4>Notifications</h4>
                  <p>✅ Checklist Updated</p>
                  <p>⏳ 5 Tasks Pending</p>
                  <p>📌 Attendance Report Ready</p>
                </div>
              )}
            </div>

            <button><FaMoon /></button>
            <div className="profile-circle">H</div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

export default Layout;