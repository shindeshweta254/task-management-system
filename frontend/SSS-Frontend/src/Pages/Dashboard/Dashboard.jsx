import Layout from "../../Components/Layout/Layout";
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
    : nameParts[0][0].toUpperCase();

     const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    deadlines: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const total = await fetch("http://localhost:8080/api/tasks/count/total").then(res => res.json());
        const pending = await fetch("http://localhost:8080/api/tasks/count/pending").then(res => res.json());
        const completed = await fetch("http://localhost:8080/api/tasks/count/completed").then(res => res.json());
        const deadlines = await fetch("http://localhost:8080/api/tasks/deadline-today").then(res => res.json());

        setStats({
          total,
          pending,
          completed,
          deadlines,
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadStats();
  }, []);

  return (
    <Layout title="Dashboard">
      <section className="hero-card">
        <div className="hero-user-info">
          <div className="profile-circle">{initials}</div>

          <div>
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

        <div className="hero-image">📊</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card purple">
          <FaClipboardList />
          <div>
            <h2>{stats.total}</h2>
            <p>Total Tasks</p>
            <span>All assigned tasks</span>
          </div>
        </div>

        <div className="stat-card orange">
          <FaHourglassHalf />
          <div>
            <h2>{stats.pending}</h2>
            <p>Pending Tasks</p>
            <span>Tasks in progress</span>
          </div>
        </div>

        <div className="stat-card green">
          <FaCheckCircle />
          <div>
            <h2>{stats.completed}</h2>
            <p>Completed Tasks</p>
            <span>Tasks completed</span>
          </div>
        </div>

        <div className="stat-card red">
          <FaFlag />
          <div>
            <h2>{stats.deadlines}</h2>
            <p>Deadlines</p>
            <span>Pending deadlines</span>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="page-card">
          <h3>Task Overview</h3>
          <div className="circle-progress">
            <h2>60%</h2>
            <p>Completed</p>
          </div>
        </div>

        <div className="page-card">
          <h3>Recent Tasks</h3>
          <p>✅ Update Checklist - Completed</p>
          <p>⏳ Prepare Monthly Report - Pending</p>
          <p>📌 Employee Attendance - In Progress</p>
        </div>
      </section>

      <section className="quick-access">
        <h3>
          Quick
          <br />
          Access
        </h3>


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