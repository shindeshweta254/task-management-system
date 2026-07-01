import Layout from "../../Components/Layout/Layout";
import "./Dashboard.css";
import { NavLink } from "react-router-dom";
import { useState } from "react";
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
  const [showForm, setShowForm] = useState(false);
  return (
    <Layout title="Dashboard">
      <section className="hero-card">
        <div>
          <h2>Welcome back, Harsh! 👋</h2>
          <p>Here's what's happening with your tasks today.</p>
          <button className="add-btn">
            <FaPlus /> add plus
          </button>
        </div>

        <div className="hero-image">📊</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card purple">
          <FaClipboardList />
          <div>
            <h2>12</h2>
            <p>Total Tasks</p>
            <span>All assigned tasks</span>
          </div>
        </div>

        <div className="stat-card orange">
          <FaHourglassHalf />
          <div>
            <h2>5</h2>
            <p>Pending Tasks</p>
            <span>Tasks in progress</span>
          </div>
        </div>

        <div className="stat-card green">
          <FaCheckCircle />
          <div>
            <h2>7</h2>
            <p>Completed Tasks</p>
            <span>Tasks completed</span>
          </div>
        </div>

        <div className="stat-card red">
          <FaFlag />
          <div>
            <h2>2</h2>
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
       <section className="quick-access">
  <h3>
    Quick
    <br />
    Access
  </h3>

  <NavLink to="/tasks">
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
        </h3>

        <button className="add-btn" onClick={() => setShowForm(true)}>
  <FaPlus /> Add Task
</button>
        <button>
          <FaClipboardList /> Checklist
        </button>

        <button>
          <FaCalendarAlt /> Attendance
        </button>

        <button>
          <FaCalendarAlt /> Calendar
        </button>

        <button>
          <FaChartBar /> Reports
        </button>

        <button>
          <FaUsers /> Team
        </button>
      </section>
    </Layout>
  );
}

export default Dashboard;