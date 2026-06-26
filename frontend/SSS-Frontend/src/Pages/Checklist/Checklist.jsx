import React, { useState } from "react";
import "./Checklist.css";

const Checklist = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Uniform & ID Card Checked", done: false },
    { id: 2, text: "Attendance Marked", done: false },
    { id: 3, text: "Cleaning Equipment Ready", done: false },
    { id: 4, text: "Washrooms Cleaned", done: false },
    { id: 5, text: "Dusting Completed", done: false },
    { id: 6, text: "Floor Mopping Completed", done: false },
    { id: 7, text: "Garbage Removed", done: false },
    { id: 8, text: "Pantry Cleaned", done: false },
    { id: 9, text: "Common Area Cleaned", done: false },
    { id: 10, text: "Supervisor Inspection", done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100);

  return (
    <div className="checklist-page">
      <div className="header-card">
        <h2>Daily Housekeeping Checklist</h2>

        <div className="details">
          <div>
            <strong>Employee:</strong> Rahul Sharma
          </div>

          <div>
            <strong>Site:</strong> ABC Mall
          </div>

          <div>
            <strong>Shift:</strong> Morning
          </div>

          <div>
            <strong>Date:</strong> 26-06-2026
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p>{progress}% Completed</p>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <div className="task-card" key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />

              <span className={task.done ? "completed" : ""}>
                {task.text}
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="btns">
        <button className="submit-btn">Submit Checklist</button>

        <button
          className="reset-btn"
          onClick={() =>
            setTasks(tasks.map((t) => ({ ...t, done: false })))
          }
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Checklist;