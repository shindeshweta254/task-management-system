import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../Components/Layout/Layout";
import "./AddTask.css";

function AddTask() {
  const navigate = useNavigate();

  const [task, setTask] = useState({
    title: "",
    employee: "",
    priority: "Medium",
    dueDate: "",
    description: "",
    status: "Pending",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const oldTasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const newTask = {
      id: Date.now(),
      ...task,
      createdAt: new Date().toLocaleDateString(),
    };

    localStorage.setItem("tasks", JSON.stringify([newTask, ...oldTasks]));

    alert("Task assigned successfully!");
    navigate("/tasks");
  };

  return (
    <Layout title="Assign Task">
      <div className="add-task-card">
        <h2>Assign New Task</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task Title"
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Employee Name"
            value={task.employee}
            onChange={(e) => setTask({ ...task, employee: e.target.value })}
            required
          />

          <select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <input
            type="date"
            value={task.dueDate}
            onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
            required
          />

          <textarea
            placeholder="Task Description"
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
          />

          <button type="submit">Assign Task</button>
        </form>
      </div>
    </Layout>
  );
}

export default AddTask;