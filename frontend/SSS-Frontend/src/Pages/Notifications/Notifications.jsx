import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { FaBell, FaExclamationTriangle, FaCalendarCheck, FaTasks } from "react-icons/fa";

const API_BASE = "http://localhost:8080";

function Notifications() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const userId = user?.id || user?.userId || null;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("User not found in local storage.");
      return;
    }

    const loadNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks/employee/${userId}`);
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Notifications load error:", e);
        setError(e.message || "Could not load notifications");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [userId]);

  const today = new Date().toISOString().slice(0, 10);

  const deadlineNotifications = tasks.filter((t) => t.dueDate === today && t.status !== "COMPLETED");
  const pendingNotifications = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const completedToday = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <Layout title="Notifications">
      <div className="director-dashboard-page" style={{ padding: 0 }}>
        <div
          className="director-hero"
          style={{ marginBottom: 18 }}
        >
          <div className="director-user-info">
            <div className="director-avatar" style={{ fontSize: 28 }}>
              <FaBell />
            </div>
            <div>
              <h1>Notifications</h1>
              <p>
                {deadlineNotifications.length} deadline
                {deadlineNotifications.length !== 1 ? "s" : ""} today
                {" | "}
                {pendingNotifications.length} pending task
                {pendingNotifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="director-loading-message">
            Loading notifications...
          </div>
        )}

        {error && !loading && (
          <div className="director-error-message">{error}</div>
        )}

        <div className="director-stats-grid" style={{ marginTop: 0, marginBottom: 18 }}>
          <div className="director-stat-card deadlines">
            <div className="director-stat-icon">
              <FaExclamationTriangle />
            </div>
            <div>
              <h2>{deadlineNotifications.length}</h2>
              <p>Today Deadlines</p>
            </div>
          </div>

          <div className="director-stat-card pending">
            <div className="director-stat-icon">
              <FaTasks />
            </div>
            <div>
              <h2>{pendingNotifications.length}</h2>
              <p>Pending Tasks</p>
            </div>
          </div>

          <div className="director-stat-card completed">
            <div className="director-stat-icon">
              <FaCalendarCheck />
            </div>
            <div>
              <h2>{completedToday.length}</h2>
              <p>Completed Tasks</p>
            </div>
          </div>
        </div>

        <div className="director-card">
          <h2>Today's Deadline Tasks</h2>
          {deadlineNotifications.length === 0 ? (
            <p style={{ color: "#747d90", marginTop: 10 }}>No deadlines today.</p>
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
                  {deadlineNotifications.map((t, i) => (
                    <tr key={t.id || i}>
                      <td>{t.taskTitle || t.title || "-"}</td>
                      <td>
                        <span className="director-task-status">{t.status}</span>
                      </td>
                      <td>{t.dueDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="director-card">
          <h2>Pending Tasks</h2>
          {pendingNotifications.length === 0 ? (
            <p style={{ color: "#747d90", marginTop: 10 }}>No pending tasks.</p>
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
                  {pendingNotifications.map((t, i) => (
                    <tr key={t.id || i}>
                      <td>{t.taskTitle || t.title || "-"}</td>
                      <td>
                        <span className="director-task-status">{t.status}</span>
                      </td>
                      <td>{t.dueDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Notifications;
