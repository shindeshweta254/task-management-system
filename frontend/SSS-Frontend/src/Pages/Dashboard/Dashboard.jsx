import "./Dashboard.css";
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);

  const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;

  const monthlyScore =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">
          <h2>Welcome</h2>
        </div>

        <ul className="menu">
          <li className="active">Dashboard</li>
          <li onClick={() => navigate("/my-tasks")}>Tasks</li>
          <li>
            <Link to="/checklist">Checklist</Link>
          </li>
          <li>Attendance</li>
          <li>Calendar</li>
          <li>Projects</li>
          <li>Team</li>
          <li>Reports</li>
          <li>Profile</li>
          <li>Settings</li>
          <li className="logout">Logout</li>
        </ul>
      </div>

      <div className="main-content">
        <div className="navbar">
          <h2>Dashboard</h2>
          <input type="text" placeholder="Search..." className="search-box" />
        </div>

        <div className="welcome-box">
          <h1>SSS Facility Services</h1>
          <p>Here's what's happening today.</p>
        </div>

        <div className="top-actions">
          <button className="plus-btn" onClick={() => navigate("/add-task")}>
            + Add Task
          </button>
        </div>

        <div className="cards">
          <div className="card">
            <h2>{tasks.length}</h2>
            <p>Total Tasks</p>
          </div>

          <div className="card">
            <h2>{pendingTasks}</h2>
            <p>Pending Tasks</p>
          </div>

          <div className="card">
            <h2>{completedTasks}</h2>
            <p>Completed Tasks</p>
          </div>

          <div className="card">
            <h2>0</h2>
            <p>Deadlines</p>
          </div>

          <div className="card">
            <h2>{monthlyScore}%</h2>
            <p>Monthly Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;