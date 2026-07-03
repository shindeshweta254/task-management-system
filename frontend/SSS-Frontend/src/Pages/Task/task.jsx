import { useEffect, useState } from "react";
import Layout from "../../Components/Layout/Layout";
import "./task.css";

function Task() {
  const [tasks, setTask] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadTask = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/task");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.log("Task load error:", error);
    }
  };

  useEffect(() => {
    loadTask();
  }, []);

  const markComplete = async (id) => {
    await fetch(`http://localhost:8080/api/task/${id}/COMPLETED`, {
      method: "PUT",
    });
    loadTask();
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:8080/api/task/${id}`, {
      method: "DELETE",
    });
    loadTask();
  };

  const filteredTasks = task.filter((task) => {
    const taskTitle = task.taskTitle || "";
    const employeeName = task.assignedTo?.name || "";
    const taskStatus = task.status || "";

    const matchesSearch =
      taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      employeeName.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "ALL" || taskStatus === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <Layout title="Task">
      <div className="task-page">
        <div className="task-header">
          <h2>All Assigned Tasks</h2>

          <div className="task-controls">
            <input
              type="text"
              placeholder="Search task or employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-task">
            <h3>No tasks found</h3>
            <p>Create task from Dashboard → Add Task</p>
          </div>
        ) : (
          <table className="task-table">
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
                  <td>{task.taskTitle}</td>
                  <td>
                    {task.assignedTo?.name || "-"} <br />
                    <small>{task.assignedTo?.employeeId || ""}</small>
                  </td>
                  <td>
                    <span className={`priority ${(task.priority || "").toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>{task.dueDate || "-"}</td>
                  <td>
                    <span className="status pending">{task.status}</span>
                  </td>
                  <td>{task.taskDescription || "-"}</td>
                  <td>
                    <div className="task-actions">
                      {task.status !== "COMPLETED" && (
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

export default Task;