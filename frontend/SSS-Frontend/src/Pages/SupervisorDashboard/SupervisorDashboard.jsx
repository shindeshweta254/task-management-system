import Layout from "../../components/Layout/Layout";
import "./SupervisorDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCalendarCheck, FaHourglassHalf, FaCheckCircle, FaClipboardList, FaUserCheck } from "react-icons/fa";

function SupervisorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userName = user.name || "Supervisor";
  const department = user.department || "-";
  const employeeId = user.employeeId || "-";

  const nameParts = userName.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "S";

  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, pending, completed, attendance] = await Promise.all([
          fetch("http://localhost:8080/api/users").then((r) => r.json()),
          fetch("http://localhost:8080/api/tasks/count/pending").then((r) => r.json()),
          fetch("http://localhost:8080/api/tasks/count/completed").then((r) => r.json()),
          fetch("http://localhost:8080/api/attendance/today").then((r) => r.json()).catch(() => 0),
        ]);

        setStats({
          totalEmployees: Array.isArray(users) ? users.length : 0,
          todayAttendance: typeof attendance === "number" ? attendance : 0,
          pendingTasks: pending || 0,
          completedTasks: completed || 0,
        });
      } catch {
        // backend band ho toh localStorage se attendance count karo
        const attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || [];
        const today = new Date().toLocaleDateString("en-IN");
        const todayCount = attendanceData.filter((a) => a.date === today && a.punchIn).length;
        setStats((prev) => ({ ...prev, todayAttendance: todayCount }));
      }
    };
    loadStats();
  }, []);

  return (
    <Layout title="Supervisor Dashboard">
      {/* Hero */}
      <section className="sv-hero">
        <div className="sv-hero-left">
          <div className="sv-avatar">{initials}</div>
          <div>
            <h2>Welcome, {userName}! 👋</h2>
            <p>ID: {employeeId} &nbsp;|&nbsp; Dept: {department} &nbsp;|&nbsp; Role: SUPERVISOR</p>
          </div>
        </div>
        <img src="/logo.png" alt="logo" className="sv-hero-logo" />
      </section>

      {/* Stats */}
      <section className="sv-stats">
        <div className="sv-stat-card blue">
          <FaUsers className="sv-icon" />
          <div>
            <h2>{stats.totalEmployees}</h2>
            <p>Total Employees</p>
            <span>Apni Site</span>
          </div>
        </div>

        <div className="sv-stat-card green">
          <FaUserCheck className="sv-icon" />
          <div>
            <h2>{stats.todayAttendance}</h2>
            <p>Today's Attendance</p>
            <span>Present today</span>
          </div>
        </div>

        <div className="sv-stat-card orange">
          <FaHourglassHalf className="sv-icon" />
          <div>
            <h2>{stats.pendingTasks}</h2>
            <p>Pending Tasks</p>
            <span>Tasks in progress</span>
          </div>
        </div>

        <div className="sv-stat-card purple">
          <FaCheckCircle className="sv-icon" />
          <div>
            <h2>{stats.completedTasks}</h2>
            <p>Completed Tasks</p>
            <span>Tasks done</span>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="sv-quick">
        <h3>Quick Access</h3>
        <div className="sv-quick-btns">
          <button onClick={() => navigate("/attendance")}><FaCalendarCheck /> Attendance</button>
          <button onClick={() => navigate("/task")}><FaClipboardList /> Tasks</button>
          <button onClick={() => navigate("/team")}><FaUsers /> Team</button>
          <button onClick={() => navigate("/checklist")}><FaCheckCircle /> Checklist</button>
        </div>
      </section>
    </Layout>
  );
}

export default SupervisorDashboard;
