import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

import { t } from "../i18n/translator";

import {
  FaTachometerAlt,
  FaClipboardList,
  FaUserCheck,
  FaCalendarAlt,
  FaProjectDiagram,
  FaUsers,
  FaChartBar,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="sidebar">

      <div className="logo">
        <img src="/logo.png" alt="SSS Logo" className="sidebar-logo" />
        <p className="sidebar-company-name">SSS FMS Facility Services</p>
      </div>

      <ul>

        <li>
          <NavLink to="/dashboard">
            <FaTachometerAlt />
            <span>{t("nav.dashboard")}</span>
          </NavLink>
        </li>

        
        <li>
          <NavLink to="/task">
            <FaTachometerAlt />
            <span>{t("nav.task")}</span>
          </NavLink>
        </li>

        <li>
       <NavLink to="/checklist">{t("nav.checklist")}</NavLink>
  
  
        </li>
        <li>
          <NavLink to="/attendance">
            <FaUserCheck />
            <span>{t("nav.attendance")}</span>
          </NavLink>
        </li>

        <li>
<NavLink to="/calendar">
  {t("nav.calendar")}
</NavLink>
        </li>

        <li>
          <NavLink to="/projects">
            <FaProjectDiagram />
            <span>{t("nav.projects")}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/team">
            <FaUsers />
            <span>{t("nav.team")}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports">
            <FaChartBar />
            <span>{t("nav.reports")}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/profile">
            <FaUserCircle />
            <span>{t("nav.profile")}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/settings">
            <FaCog />
            <span>{t("nav.settings")}</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/">
            <FaSignOutAlt />
            <span>{t("nav.logout")}</span>
          </NavLink>

          
        </li>
      

      </ul>

    </div>
  );
};

export default Sidebar;