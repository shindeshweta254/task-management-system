import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Tasklist.css";

function Tasklist() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);

  const completeTask = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, status: "Completed" } : task
    );

    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);

    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  return (
    <div className="tasklist-page">
      <div className="tasklist-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h1>My Tasks</h1>
      </div>

      {tasks.length === 0 ? (
        <p className="no-task">No Tasks Added Yet</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Assigned By</th>
              <th>Assigned To</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.taskName}</td>
                <td>{task.assignedBy}</td>
                <td>{task.assignedTo}</td>
                <td>{task.department}</td>
                <td>{task.priority}</td>
                <td>{task.status}</td>
                <td>{task.dueDate}</td>
                <td>
                  {task.status === "Pending" && (
                    <button
                      className="complete-btn"
                      onClick={() => completeTask(task.id)}
                    >
                      Complete
                    </button>
                  )}

                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Tasklist;