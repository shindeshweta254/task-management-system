import { useEffect, useState } from "react";
import Layout from "../../Components/Layout/Layout";
import "./Tasks.css";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);

  const updateTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const markComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, status: "Completed" } : task
    );

    updateTasks(updatedTasks);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    updateTasks(updatedTasks);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.employee.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All" || task.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <Layout title="Tasks">
      <div className="tasks-page">
        <div className="tasks-header">
          <h2>Assigned Tasks</h2>

          <div className="task-controls">
            <input
              type="text"
              placeholder="Search task or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-task">
            <h3>No tasks found</h3>
            <p>Add task from Dashboard → Add Task</p>
          </div>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Employee</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.employee}</td>
                  <td>
                    <span className={`priority ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>{task.dueDate || "-"}</td>
                  <td>
                    <span
                      className={
                        task.status === "Completed"
                          ? "status completed"
                          : "status pending"
                      }
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>{task.description || "-"}</td>
                  <td>
                    <div className="task-actions">
                      {task.status !== "Completed" && (
                        <button
                          className="complete-btn"
                          onClick={() => markComplete(task.id)}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Tasks;