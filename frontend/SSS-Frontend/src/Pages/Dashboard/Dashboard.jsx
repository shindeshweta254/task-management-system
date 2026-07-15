import Layout from "../../components/Layout/Layout";
import "./Dashboard.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { t } from "../../i18n/translator";

import {
  FaPlus,
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const userName = user.name || "Employee";
  const employeeId = user.employeeId || "-";

  // TasController expects Long userId (DB primary key). Some logins may store employeeId/code as strings,
  // so guard against invalid values.
  const userIdForApi = Number(user?.id);
  const canFetchEmployeeStats = Number.isFinite(userIdForApi) && userIdForApi > 0;

  const department = user.department || "-";
  const roleName = user.role?.roleName || "EMPLOYEE";

  const nameParts = userName.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "E";

  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [totalEmployeesRes, pendingRes, completedRes, todayAttendanceRes] =
          await Promise.all([
            fetch("http://localhost:8080/api/dashboard/total-employees").then((res) => res.json()),
            // Employee-specific task counts
            canFetchEmployeeStats
              ? fetch(`http://localhost:8080/api/tasks/dashboard/${userIdForApi}/pending`).then((res) => res.json())
              : Promise.resolve(0),
            canFetchEmployeeStats
              ? fetch(`http://localhost:8080/api/tasks/dashboard/${userIdForApi}/completed`).then((res) => res.json())
              : Promise.resolve(0),
            fetch("http://localhost:8080/api/dashboard/todays-attendance")
              .then((res) => res.json())
              .catch(() => 0),
          ]);

        setStats({
          totalEmployees: totalEmployeesRes,
          pendingTasks: pendingRes,
          completedTasks: completedRes,
          todayAttendance: todayAttendanceRes,
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
        // keep UI stable even if one endpoint fails
      }
    };

    loadStats();
  }, []);

  const progress =
    stats.pendingTasks + stats.completedTasks === 0
      ? 0
      : Math.round((stats.completedTasks / (stats.pendingTasks + stats.completedTasks)) * 100);

  return (
    <Layout title="Dashboard">
      <section className="hero-card">
        <div className="hero-user-info">
          <div className="profile-circle">{initials}</div>

          <div>
            <h2>
              {t("dashboard.titleWelcome")}, {userName}! 👋
            </h2>
            <p>
              {t("dashboard.employeeId")}: {employeeId} | {t("dashboard.department")}: {department} | {t("dashboard.role")}{" "}
              {roleName}
            </p>

            <button
              type="button"
              className="add-btn"
              onClick={() => navigate("/add-task")}
            >
              <FaPlus /> {t("dashboard.addTask")}
            </button>
          </div>
        </div>

        <div className="hero-image">
          <img src="/logo.png" alt="SSS Logo" className="dashboard-logo" />
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card purple">
          <FaUsers />
          <div>
            <h2>{stats.totalEmployees}</h2>
            <p>{t("dashboard.totalEmployees")}</p>
            <span>{t("dashboard.apniSite")}</span>
          </div>
        </div>

        <div className="stat-card orange">
          <FaCalendarAlt />
          <div>
            <h2>{stats.todayAttendance}</h2>
            <p>{t("dashboard.todayAttendance")}</p>
            <span>{t("dashboard.presentToday")}</span>
          </div>
        </div>

        <div className="stat-card green">
          <FaHourglassHalf />
          <div>
            <h2>{stats.pendingTasks}</h2>
            <p>{t("dashboard.pendingTasks")}</p>
            <span>{t("dashboard.tasksInProgress")}</span>
          </div>
        </div>

        <div className="stat-card red">
          <FaCheckCircle />
          <div>
            <h2>{stats.completedTasks}</h2>
            <p>{t("dashboard.completedTasks")}</p>
            <span>{t("dashboard.tasksCompleted")}</span>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="page-card">
          <h3>{t("dashboard.taskOverview")}</h3>
          <div className="circle-progress">
            <h2>{progress}%</h2>
            <p>{t("dashboard.completed")}</p>
          </div>
        </div>

        <div className="page-card">
          <h3>{t("dashboard.recentTasks")}</h3>
          <p>{t("dashboard.recent1")}</p>
          <p>{t("dashboard.recent2")}</p>
          <p>{t("dashboard.recent3")}</p>
        </div>
      </section>

      <section className="quick-access">
        <h3>
          {t("dashboard.quickAccess").split(" ")[0]}
          <br />
          {t("dashboard.quickAccess").split(" ").slice(1).join(" ")}
        </h3>

        <NavLink to="/add-task">
          <FaPlus /> {t("dashboard.addTask")}
        </NavLink>

        <NavLink to="/checklist">
          <FaClipboardList /> {t("nav.checklist")}
        </NavLink>

        <NavLink to="/attendance">
          <FaCalendarAlt /> {t("nav.attendance")}
        </NavLink>

        <NavLink to="/calendar">
          <FaCalendarAlt /> {t("nav.calendar")}
        </NavLink>

        <NavLink to="/reports">
          <FaChartBar /> {t("nav.reports")}
        </NavLink>

        <NavLink to="/team">
          <FaUsers /> {t("nav.team")}
        </NavLink>
      </section>
    </Layout>
  );
}

export default Dashboard;

