import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddTask.css";

function AddTask() {
  const navigate = useNavigate();

  const [task, setTask] = useState({
    assignedBy: "",
    assignedTo: "",
    department: "",
    taskName: "",
    description: "",
    workingHours: "",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    status: "Pending"
  });

  const handleChange = (e) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const existingTasks =
      JSON.parse(localStorage.getItem("tasks")) || [];

    const newTask = {
      id: Date.now(),
      ...task,
    };

    existingTasks.push(newTask);

    localStorage.setItem(
      "tasks",
      JSON.stringify(existingTasks)
    );

    alert("✅ Task Assigned Successfully!");

    setTask({
      assignedBy: "",
      assignedTo: "",
      department: "",
      taskName: "",
      description: "",
      workingHours: "",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      status: "Pending",
    });

    // Dashboard par redirect
    navigate("/dashboard");
  };

  return (
    <div className="add-task-page">
      <div className="task-container">

        <div className="top-bar">
  <button
    className="back-btn"
    onClick={() => navigate("/dashboard")}
  >
    ←
  </button>
</div>
        <h1>Create New Task</h1>

        <form className="task-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="assignedBy"
            placeholder="Assigned By"
            value={task.assignedBy}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="assignedTo"
            placeholder="Assigned To"
            value={task.assignedTo}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={task.department}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="taskName"
            placeholder="Task Name"
            value={task.taskName}
            onChange={handleChange}
            required
          />

          <select
            name="workingHours"
            value={task.workingHours}
            onChange={handleChange}
            required
          >
            <option value="">Select Working Hours</option>
            <option>1 Hour</option>
            <option>2 Hours</option>
            <option>3 Hours</option>
            <option>4 Hours</option>
            <option>5 Hours</option>
            <option>6 Hours</option>
            <option>8 Hours</option>
          </select>

          <select
            name="priority"
            value={task.priority}
            onChange={handleChange}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <input
            type="date"
            name="startDate"
            value={task.startDate}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="dueDate"
            value={task.dueDate}
            onChange={handleChange}
            required
          />

          <select
            name="status"
            value={task.status}
            onChange={handleChange}
          >
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>

          <textarea
            name="description"
            placeholder="Task Description"
            value={task.description}
            onChange={handleChange}
            required
          />

          <div className="button-group">
            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                setTask({
                  assignedBy: "",
                  assignedTo: "",
                  department: "",
                  taskName: "",
                  description: "",
                  workingHours: "",
                  priority: "Medium",
                  startDate: "",
                  dueDate: "",
                  status: "Pending",
                })
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTask;