import { useCallback, useEffect, useMemo, useState } from "react";

import Layout from "../../components/Layout/Layout";
import { fetchWeeklyControlCenter } from "../../api/weeklyControlCenterApi";
import { fetchAllUsers } from "../../api/userApi";

import "./WeeklyControlCenter.css";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeek() {
  const today = new Date();
  const day = today.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function WeeklyControlCenter() {
  const currentWeek = useMemo(() => getCurrentWeek(), []);

  const [startDate, setStartDate] = useState(currentWeek.startDate);
  const [endDate, setEndDate] = useState(currentWeek.endDate);
  const [site, setSite] = useState("");

  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const siteOptions = useMemo(() => {
    const sites = new Set();

    users.forEach((user) => {
      String(user?.siteCode || "")
        .split(",")
        .map((value) => value.trim())
        .filter(
          (value) =>
            value &&
            value.toUpperCase() !== "ALL"
        )
        .forEach((value) => sites.add(value));
    });

    return [...sites].sort((a, b) => a.localeCompare(b));
  }, [users]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Unable to load site options:", err);
      setUsers([]);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Please select start date and end date.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await fetchWeeklyControlCenter(
        startDate,
        endDate,
        site
      );

      setSummary(data || null);
    } catch (err) {
      console.error("Weekly Control Center error:", err);

      setError(
        err?.message ||
          "Unable to load Weekly Control Center."
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, site]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const attendanceStatuses = Object.entries(
    summary?.attendanceByStatus || {}
  );

  return (
    <Layout title="Weekly Control Center">
      <div className="wcc-page">
        <div className="wcc-header">
          <div>
            <h2>Weekly Control Center</h2>
            <p>
              Weekly overview of Tasks, Attendance and Checklist
              activity.
            </p>
          </div>

          <button
            type="button"
            className="wcc-refresh-btn"
            onClick={loadSummary}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="wcc-filters">
          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />
          </label>

          <label>
            Site
            <select
              value={site}
              onChange={(event) => setSite(event.target.value)}
            >
              <option value="">All Accessible Sites</option>

              {siteOptions.map((siteCode) => (
                <option key={siteCode} value={siteCode}>
                  {siteCode}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="wcc-error">
            {error}
          </div>
        )}

        {loading && !summary ? (
          <div className="wcc-loading">
            Loading weekly summary...
          </div>
        ) : (
          <>
            <div className="wcc-section">
              <div className="wcc-section-heading">
                <div>
                  <h3>Task Overview</h3>
                  <p>
                    {summary?.startDate || startDate} to{" "}
                    {summary?.endDate || endDate}
                  </p>
                </div>

                <span className="wcc-site-badge">
                  {summary?.site || "All Accessible Sites"}
                </span>
              </div>

              <div className="wcc-card-grid">
                <div className="wcc-card">
                  <span>Total Tasks</span>
                  <strong>{summary?.totalTasks ?? 0}</strong>
                </div>

                <div className="wcc-card">
                  <span>Pending Tasks</span>
                  <strong>{summary?.pendingTasks ?? 0}</strong>
                </div>

                <div className="wcc-card">
                  <span>Completed Tasks</span>
                  <strong>{summary?.completedTasks ?? 0}</strong>
                </div>

                <div className="wcc-card">
                  <span>Overdue Tasks</span>
                  <strong>{summary?.overdueTasks ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className="wcc-section">
              <div className="wcc-section-heading">
                <div>
                  <h3>Attendance Overview</h3>
                  <p>Attendance records for the selected week.</p>
                </div>
              </div>

              <div className="wcc-card-grid">
                <div className="wcc-card">
                  <span>Total Attendance Records</span>
                  <strong>
                    {summary?.attendanceRecords ?? 0}
                  </strong>
                </div>

                {attendanceStatuses.map(([status, count]) => (
                  <div
                    className="wcc-card"
                    key={status}
                  >
                    <span>{status.replaceAll("_", " ")}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="wcc-section">
              <div className="wcc-section-heading">
                <div>
                  <h3>Checklist Overview</h3>
                  <p>
                    Checklist activity for the selected week.
                  </p>
                </div>
              </div>

              <div className="wcc-card-grid">
                <div className="wcc-card">
                  <span>Checklist Submissions</span>
                  <strong>
                    {summary?.checklistSubmissions ?? 0}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default WeeklyControlCenter;