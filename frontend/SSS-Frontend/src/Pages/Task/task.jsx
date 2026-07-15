import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./task.css";
import { FaEllipsisV } from "react-icons/fa";
import { t } from "../../i18n/translator";

import { updateTaskStatus, markTaskCompleted, deleteTask } from "../../api/taskApi";
import { useTasks } from "../../hooks/useTasks";
import { getUserFromStorage } from "../../utils/userStorage";

function Task() {
  const user = getUserFromStorage("user");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { tasks, reload } = useTasks(user);

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
    <Layout title={t("nav.task")}> 

      <div className="task-page">
        <div className="task-header">
          <h2>{t("task.allAssignedTasks")}</h2>

          <div className="task-controls">
            <input
              type="text"
              placeholder={t("task.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">{t("task.filters.all")}</option>
              <option value="PENDING">{t("task.filters.pending")}</option>
              <option value="IN_PROGRESS">{t("task.filters.inProgress")}</option>
              <option value="COMPLETED">{t("task.filters.completed")}</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-task">
            <h3>{t("task.empty.title")}</h3>
            <p>{t("task.empty.subtitle")}</p>
          </div>
        ) : (
          <div className="task-table-wrapper">
            <table className="task-table">
            <thead>
              <tr>
                <th>{t("task.tableHeaders.task")}</th>
                <th>{t("task.tableHeaders.employee")}</th>
                <th>{t("task.tableHeaders.priority")}</th>
                <th>{t("task.tableHeaders.dueDate")}</th>
                <th>{t("task.tableHeaders.status")}</th>
                <th>{t("task.tableHeaders.description")}</th>
                <th>{t("task.tableHeaders.action")}</th>
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
                                {t("task.actions.complete")}
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
                              {t("task.actions.update")}
                            </button>
                            <button className="dropdown-item">{t("task.actions.create")}</button>
                                <button
                                className="dropdown-item delete"
                                onClick={() => deleteTask(task.id)}
                            >
                              {t("task.actions.delete")}
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

              <h2>{t("task.modal.title")}</h2>

              <div className="modal-body">
                <div className="modal-field">
                  <label>{t("task.modal.fields.taskTitle")}</label>
                  <p>{selectedTask.taskTitle}</p>
                </div>

                <div className="modal-field">
                  <label>{t("task.modal.fields.employee")}</label>
                  <p>
                    {selectedTask.assignedTo?.name || "-"}{" "}
                    <small>({selectedTask.assignedTo?.employeeId || ""})</small>
                  </p>
                </div>

                <div className="modal-field">
                  <label>{t("task.modal.fields.priority")}</label>
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
                  <label>{t("task.modal.fields.dueDate")}</label>
                  <p>{selectedTask.dueDate || "-"}</p>
                </div>

                <div className="modal-field">
                  <label>{t("task.modal.fields.status")}</label>
                  <div className="status-filter">
                    <button
                      className={`status-btn ${
                        selectedTask.status === "PENDING" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "PENDING")
                      }
                    >
                      {t("task.status.pending")}
                    </button>
                    <button
                      className={`status-btn ${
                        selectedTask.status === "IN_PROGRESS" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "IN_PROGRESS")
                      }
                    >
                      {t("task.status.inProgress")}
                    </button>
                    <button
                      className={`status-btn ${
                        selectedTask.status === "COMPLETED" ? "active" : ""
                      }`}
                      onClick={() =>
                        updateTaskStatus(selectedTask.id, "COMPLETED")
                      }
                    >
                      {t("task.status.completed")}
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label>{t("task.modal.fields.description")}</label>
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
                    {t("task.modal.fields.saveChanges")}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    {t("task.modal.fields.close")}
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