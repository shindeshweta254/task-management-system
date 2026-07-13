import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./task.css";
import { FaEllipsisV } from "react-icons/fa";

function Task() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadTask = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/tasks");
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
    await fetch(`http://localhost:8080/api/tasks/${id}/COMPLETED`, {
      method: "PUT",
    });
    setOpenDropdown(null);
    loadTask();
  };

  const updateTaskStatus = async (id, status) => {
    await fetch(`http://localhost:8080/api/tasks/${id}/${status}`, {
      method: "PUT",
    });
    setOpenDropdown(null);
    loadTask();
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:8080/api/tasks/${id}`, {
      method: "DELETE",
    });
    setOpenDropdown(null);
    loadTask();
  };

  const filteredTasks = tasks.filter((task) => {
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
          <div className="task-table-wrapper">
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
                      <button
                        className="view-btn"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowModal(true);
                        }}
                      >
                        View All
                      </button>

                      <div className="dropdown-container">
                        <button
                          className="dropdown-btn"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === task.id ? null : task.id
                            )
                          }
                        >
                          <FaEllipsisV />
                        </button>

                        {openDropdown === task.id && (
                          <div className="dropdown-menu">
                            {task.status !== "COMPLETED" && (
                              <button
                                className="dropdown-item"
                                onClick={() => markComplete(task.id)}
                              >
                                ✓ Complete
                              </button>
                            )}
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowModal(true);
                                setOpenDropdown(null);
                              }}
                            >
                              ✎ Update
                            </button>
                            <button className="dropdown-item">+ Create</button>
                            <button
                              className="dropdown-item delete"
                              onClick={() => deleteTask(task.id)}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        {/* View All Modal */}
        {showModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>

              <h2>Task Details</h2>

              <div className="modal-body">
                <div className="modal-field">
                  <label>Task Title:</label>
                  <p>{selectedTask.taskTitle}</p>
                </div>

                <div className="modal-field">
                  <label>Employee:</label>
                  <p>
                    {selectedTask.assignedTo?.name || "-"}{" "}
                    <small>({selectedTask.assignedTo?.employeeId || ""})</small>
                  </p>
                </div>

                <div className="modal-field">
                  <label>Priority:</label>
                  <p>
                    <span
                      className={`priority ${(
                        selectedTask.priority || ""
                      ).toLowerCase()}`}
                    >
                      {selectedTask.priority}
                    </span>
                  </p>
                </div>

                <div className="modal-field">
                  <label>Due Date:</label>
                  <p>{selectedTask.dueDate || "-"}</p>
                </div>

                <div className="modal-field">
                  <label>Status:</label>
                  <div className="status-filter">
                    <button
                      className={`status-btn ${
                        selectedTask.status === "PENDING" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "PENDING")
                      }
                    >
                      Pending
                    </button>
                    <button
                      className={`status-btn ${
                        selectedTask.status === "IN_PROGRESS" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "IN_PROGRESS")
                      }
                    >
                      In Progress
                    </button>
                    <button
                      className={`status-btn ${
                        selectedTask.status === "COMPLETED" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "COMPLETED")
                      }
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Description:</label>
                  <p>{selectedTask.taskDescription || "-"}</p>
                </div>

                <div className="modal-actions">
                  <button
                    className="save-btn"
                    onClick={() => {
                      setShowModal(false);
                      loadTask();
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Task;