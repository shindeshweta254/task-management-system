import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import { Link } from "react-router-dom";


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
            <span>Dashboard</span>
          </NavLink>
        </li>

        
        <li>
          <NavLink to="/Task">
            <FaTachometerAlt />
            <span>Task</span>
          </NavLink>
        </li>

        <li>
       <NavLink to="/checklist">Checklist</NavLink>
  
        </li>
        <li>
          <NavLink to="/attendance">
            <FaUserCheck />
            <span>Attendance</span>
          </NavLink>
        </li>

        <li>
<NavLink to="/calender">
  Calender
</NavLink>
        </li>

        <li>
          <NavLink to="/projects">
            <FaProjectDiagram />
            <span>Projects</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/team">
            <FaUsers />
            <span>Team</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports">
            <FaChartBar />
            <span>Reports</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/profile">
            <FaUserCircle />
            <span>Profile</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/settings">
            <FaCog />
            <span>Settings</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/">
            <FaSignOutAlt />
            <span>Logout</span>
          </NavLink>
          
        </li>
      

      </ul>

    </div>
  );
};

export default Sidebar;