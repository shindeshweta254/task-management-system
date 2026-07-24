import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarCheck,
  FaTasks,
  FaCheckCircle,
  FaHourglassHalf,
  FaFlag,
  FaPlus,
  FaSyncAlt,
  FaBell,
} from "react-icons/fa";

import Layout from "../../components/Layout/Layout";
import "../DirectorDashboard/DirectorDashboard.css";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:8080";

const INITIAL_STATS = {
  totalTasks: 0,
  pendingTasks: 0,
  completedTasks: 0,
  deadlines: 0,
  todayAttendance: 0,
  notifications: 0,
};

function Dashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const userName = user?.name || "Employee";
  const employeeId = user?.employeeId || "-";
  const department = user?.department || "-";
  const roleName = user?.roleName || user?.role?.roleName || "EMPLOYEE";

  // Redirect DIRECTOR users to Director Dashboard
  useEffect(() => {
    if (String(roleName).toUpperCase() === "DIRECTOR") {
      navigate("/director-dashboard", { replace: true });
    }
  }, [roleName, navigate]);

  const initials = useMemo(() => {
    const nameParts = String(userName).trim().split(/\s+/).filter(Boolean);
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0]?.[0]?.toUpperCase() || "E";
  }, [userName]);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const getUserId = (userObj) => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?.employeeId;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const userId = getUserId(user);
    if (!userId) {
      setLoading(false);
      setPageError("User not found. Please log in again.");
      return;
    }

    try {
      const [tasksData] = await Promise.all([
        (async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/tasks/employee/${userId}`, {
              headers: { "X-User-Id": String(userId), "Content-Type": "application/json" },
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })(),
      ]);

      setMyTasks(tasksData);

      const total = tasksData.length;
      const pending = tasksData.filter(
        (t) => String(t?.status).toUpperCase() === "PENDING" || String(t?.status).toUpperCase() === "IN_PROGRESS"
      ).length;
      const completed = tasksData.filter(
        (t) => String(t?.status).toUpperCase() === "COMPLETED"
      ).length;
      const today = new Date().toISOString().slice(0, 10);
      const deadlines = tasksData.filter(
        (t) => t?.dueDate === today && String(t?.status).toUpperCase() !== "COMPLETED"
      ).length;

      const attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || [];
      const todayAttendance = attendanceData.filter((a) => a?.date === today && a?.punchIn).length;

      setStats({
        totalTasks: total,
        pendingTasks: pending,
        completedTasks: completed,
        deadlines: deadlines,
        todayAttendance: todayAttendance || 0,
        notifications: pending + deadlines,
      });
    } catch (error) {
      console.error("Dashboard load error:", error);
      setPageError("Data load nahi hua.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <Layout title="Dashboard">
      <div className="director-dashboard-page">
        <div className="director-tabs">
          <div className="director-tabs-scroll">
            <button
              type="button"
              className="director-add-task-button"
              onClick={() => navigate("/add-task")}
              title="Add Task"
            >
              <FaPlus /> Add Task
            </button>
          </div>

          <button
            type="button"
            className="director-refresh-button"
            onClick={loadDashboardData}
            title="Refresh dashboard"
          >
            <FaSyncAlt />
          </button>
        </div>

        {pageError && <div className="director-error-message">{pageError}</div>}

        {loading && (
          <div className="director-loading-message">Loading Employee Dashboard...</div>
        )}

        {!loading && (
          <>
            <section className="director-hero">
              <div className="director-user-info">
                <div className="director-avatar">{initials}</div>
                <div>
                  <h1>
                    Welcome, {userName}! <span>👋</span>
                  </h1>
                  <p>
                    ID: {employeeId}
                    <span> | </span>
                    Dept: {department}
                    <span> | </span>
                    Role: {roleName}
                  </p>
                </div>
              </div>
              <img
                src="/logo.png"
                alt="SSS FMS Logo"
                className="director-hero-logo"
              />
            </section>

            <section className="director-stats-grid">
              <div className="director-stat-card tasks">
                <div className="director-stat-icon"><FaTasks /></div>
                <div>
                  <h2>{stats.totalTasks}</h2>
                  <p>My Total Tasks</p>
                </div>
              </div>

              <div className="director-stat-card pending">
                <div className="director-stat-icon"><FaHourglassHalf /></div>
                <div>
                  <h2>{stats.pendingTasks}</h2>
                  <p>My Pending Tasks</p>
                </div>
              </div>

              <div className="director-stat-card completed">
                <div className="director-stat-icon"><FaCheckCircle /></div>
                <div>
                  <h2>{stats.completedTasks}</h2>
                  <p>My Completed Tasks</p>
                </div>
              </div>

              <div className="director-stat-card deadlines">
                <div className="director-stat-icon"><FaFlag /></div>
                <div>
                  <h2>{stats.deadlines}</h2>
                  <p>My Today Deadlines</p>
                </div>
              </div>

              <div className="director-stat-card attendance">
                <div className="director-stat-icon"><FaCalendarCheck /></div>
                <div>
                  <h2>{stats.todayAttendance}</h2>
                  <p>My Attendance Status</p>
                </div>
              </div>

              <div className="director-stat-card notifications">
                <div className="director-stat-icon"><FaBell /></div>
                <div>
                  <h2>{stats.notifications}</h2>
                  <p>Notifications</p>
                </div>
              </div>
            </section>

            <section className="director-card">
              <div className="director-card-heading">
                <div>
                  <h2>My Recent Tasks</h2>
                  <p>{myTasks.length} tasks assigned</p>
                </div>
                <button type="button" onClick={() => navigate("/task")}>
                  View All
                </button>
              </div>

              {myTasks.length === 0 ? (
                <p style={{ color: "#747d90" }}>No tasks assigned yet.</p>
              ) : (
                <div className="director-table-wrapper">
                  <table className="director-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTasks.slice(0, 5).map((t, i) => (
                        <tr key={t.id || i}>
                          <td>{t.taskTitle || t.title || "-"}</td>
                          <td>
                            <span className="director-task-status">
                              {t.status || "PENDING"}
                            </span>
                          </td>
                          <td>{t.dueDate || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;
