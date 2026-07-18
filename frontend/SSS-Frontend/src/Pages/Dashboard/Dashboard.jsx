import Layout from "../../components/Layout/Layout";
import "./Dashboard.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FaPlus,
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaFlag,
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const userName = user.name || "Employee";
  const employeeId = user.employeeId || "-";
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

  const [myTasks, setMyTasks] = useState([]);

  const getUserId = (userObj) => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?.employeeId;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  const myTasksFiltered = myTasks.filter((t) => {
    const taskDept = t?.assignedTo?.department || t?.assignedTo?.dept || null;
    if (!department || department === "-") return true;
    if (!taskDept) return true;
    return String(taskDept).toLowerCase() === String(department).toLowerCase();
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Helper: coerce API value into a safe number for rendering.
        const safeNumber = (value) =>
          typeof value === "number" ? value : 0;

        const totalEmployeesReq = (async () => {
          try {
            const res = await fetch(
              "http://localhost:8080/api/dashboard/total-employees"
            );
            const data = await res.json();
            return safeNumber(data);
          } catch (err) {
            console.error("Dashboard total-employees API error:", err);
            return 0;
          }
        })();

        const pendingReq = (async () => {
          try {
            const res = await fetch("http://localhost:8080/api/tasks/count/pending");
            const data = await res.json();
            return safeNumber(data);
          } catch (err) {
            console.error("Dashboard pending-tasks API error:", err);
            return 0;
          }
        })();

        const completedReq = (async () => {
          try {
            const res = await fetch("http://localhost:8080/api/tasks/count/completed");
            const data = await res.json();
            return safeNumber(data);
          } catch (err) {
            console.error("Dashboard completed-tasks API error:", err);
            return 0;
          }
        })();

        // If backend does not have this endpoint yet, it will fail and we fallback to 0.
        const todayAttendanceReq = (async () => {
          try {
            const res = await fetch(
              "http://localhost:8080/api/dashboard/todays-attendance"
            );
            const data = await res.json();
            return safeNumber(data);
          } catch (err) {
            console.error("Dashboard todays-attendance API error:", err);
            return 0;
          }
        })();

        const [totalEmployeesRes, pendingRes, completedRes, todayAttendanceRes] =
          await Promise.all([
            totalEmployeesReq,
            pendingReq,
            completedReq,
            todayAttendanceReq,
          ]);

        setStats({
          totalEmployees: safeNumber(totalEmployeesRes),
          pendingTasks: safeNumber(pendingRes),
          completedTasks: safeNumber(completedRes),
          todayAttendance: safeNumber(todayAttendanceRes),
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
        // keep UI stable even if one endpoint fails
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        const id = getUserId(user);
        if (!id) return;
        const res = await fetch(`http://localhost:8080/api/tasks/employee/${id}`);
        const data = await res.json();
        setMyTasks(Array.isArray(data) ? data : []);
      } catch {
        setMyTasks([]);
      }
    };

    loadMyTasks();
  }, []);


  const progress =
    stats.pendingTasks + stats.completedTasks === 0
      ? 0
      : Math.round(
          (stats.completedTasks / (stats.pendingTasks + stats.completedTasks)) * 100
        );


  return (
    <Layout title="Dashboard">
      <section className="hero-card">
        <div className="hero-left">
          <div className="hero-user-info">
            <div className="profile-circle">{initials}</div>

            <div className="hero-text">
              <h2>Welcome back, {userName}! 👋</h2>
              <p>
                Employee ID: {employeeId} | Department: {department} | Role:{" "}
                {roleName}
              </p>

              <button
                type="button"
                className="add-btn"
                onClick={() => navigate("/add-task")}
              >
                <FaPlus /> Add Task
              </button>
            </div>
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
            <p>Total Employees</p>
            <span>Apni Site</span>
          </div>
        </div>

        <div className="stat-card orange">
          <FaCalendarAlt />
          <div>
            <h2>{stats.todayAttendance}</h2>
            <p>Today’s Attendance</p>
            <span>Present today</span>
          </div>
        </div>

        <div className="stat-card green">
          <FaHourglassHalf />
          <div>
            <h2>{stats.pendingTasks}</h2>
            <p>Pending Tasks</p>
            <span>Tasks in progress</span>
          </div>
        </div>

        <div className="stat-card red">
          <FaCheckCircle />
          <div>
            <h2>{stats.completedTasks}</h2>
            <p>Completed Tasks</p>
            <span>Tasks completed</span>
          </div>
        </div>
      </section>



      <section className="bottom-grid">
        <div className="page-card">
          <h3>Task Overview</h3>
          <div className="circle-progress">
            <h2>{progress}%</h2>
            <p>Completed</p>
          </div>
        </div>

        <div className="page-card">
          <h3>My Tasks (Dept: {department})</h3>
          {myTasksFiltered.length === 0 ? (
            <p>No tasks assigned yet.</p>
          ) : (
            myTasksFiltered.slice(0, 5).map((t) => (
              <p key={t.id}>
                ✅/⏳ {t.taskTitle} - <b>{t.status}</b>
                {t.dueDate ? ` (Due: ${t.dueDate})` : ""}
              </p>
            ))
          )}
        </div>
      </section>

      <section className="quick-access">
        <h3>
          Quick
          <br />
          Access
        </h3>

        <NavLink to="/add-task">
          <FaPlus /> Add Task
        </NavLink>

        <NavLink to="/checklist">
          <FaClipboardList /> Checklist
        </NavLink>

        <NavLink to="/attendance">
          <FaCalendarAlt /> Attendance
        </NavLink>

        <NavLink to="/calendar">
          <FaCalendarAlt /> Calendar
        </NavLink>

        <NavLink to="/reports">
          <FaChartBar /> Reports
        </NavLink>

        <NavLink to="/team">
          <FaUsers /> Team
        </NavLink>
      </section>
    </Layout>
  );
}

export default Dashboard;