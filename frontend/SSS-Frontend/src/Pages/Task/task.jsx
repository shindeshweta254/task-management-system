import { useMemo, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";

import Layout from "../../components/Layout/Layout";
import "./task.css";

import {
  updateTaskStatus,
  markTaskCompleted,
  deleteTask,
} from "../../api/taskApi";

import { useTasks } from "../../hooks/useTasks";

function getLoggedInUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("user")) || {}
    );
  } catch (error) {
    console.error(
      "Invalid localStorage user data:",
      error
    );

    return {};
  }
}

function Task() {
  const user = getLoggedInUser();

  const {
    tasks,
    loading,
    error,
    reload,
  } = useTasks(user);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [openDropdown, setOpenDropdown] =
    useState(null);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [showModal, setShowModal] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const filteredTasks = useMemo(() => {
    const safeTasks = Array.isArray(tasks)
      ? tasks
      : [];

    const searchValue = search
      .trim()
      .toLowerCase();

    return safeTasks.filter((task) => {
      const title = String(
        task?.taskTitle ||
          task?.title ||
          ""
      ).toLowerCase();

      const employeeName = String(
        task?.assignedTo?.name || ""
      ).toLowerCase();

      const employeeId = String(
        task?.assignedTo?.employeeId || ""
      ).toLowerCase();

      const status = String(
        task?.status || "PENDING"
      ).toUpperCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue);

      const matchesFilter =
        filter === "ALL" || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const closeModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const handleMarkComplete = async (taskId) => {
    setActionLoading(true);
    setActionError("");

    try {
      await markTaskCompleted(taskId);

      setOpenDropdown(null);
      await reload();
    } catch (requestError) {
      console.error(
        "Complete task error:",
        requestError
      );

      setActionError(
        requestError?.message ||
          "Task could not be completed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (
    taskId,
    newStatus
  ) => {
    setActionLoading(true);
    setActionError("");

    try {
      await updateTaskStatus(
        taskId,
        newStatus
      );

      setSelectedTask((previousTask) => {
        if (!previousTask) {
          return previousTask;
        }

        return {
          ...previousTask,
          status: newStatus,
        };
      });

      await reload();
    } catch (requestError) {
      console.error(
        "Update task status error:",
        requestError
      );

      setActionError(
        requestError?.message ||
          "Task status could not be updated."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      await deleteTask(taskId);

      setOpenDropdown(null);
      closeModal();

      await reload();
    } catch (requestError) {
      console.error(
        "Delete task error:",
        requestError
      );

      setActionError(
        requestError?.message ||
          "Task could not be deleted."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const visibleError =
    actionError ||
    (typeof error === "string" ? error : "");

  return (
    <Layout title="Task">
      <div className="task-page">
        <div className="task-header">
          <div>
            <h2>All Assigned Tasks</h2>

            <p className="task-count">
              Total tasks: {filteredTasks.length}
            </p>
          </div>

          <div className="task-controls">
            <input
              type="text"
              placeholder="Search task or employee..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Tasks
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>
          </div>
        </div>

        {visibleError && (
          <div className="task-error-message">
            {visibleError}
          </div>
        )}

        {loading ? (
          <div className="empty-task">
            <h3>Loading tasks...</h3>
            <p>Please wait.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-task">
            <h3>No tasks found</h3>
            <p>
              There are currently no tasks to display.
            </p>
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
                {filteredTasks.map(
                  (task, index) => {
                    const taskKey =
                      task?.id ?? index;

                    const status = String(
                      task?.status || "PENDING"
                    ).toUpperCase();

                    const priority = String(
                      task?.priority || ""
                    ).toLowerCase();

                    return (
                      <tr key={taskKey}>
                        <td>
                          {task?.taskTitle ||
                            task?.title ||
                            "-"}
                        </td>

                        <td>
                          {task?.assignedTo?.name ||
                            "-"}

                          <br />

                          <small>
                            {task?.assignedTo
                              ?.employeeId || ""}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`priority ${priority}`}
                          >
                            {task?.priority || "-"}
                          </span>
                        </td>

                        <td>
                          {task?.dueDate || "-"}
                        </td>

                        <td>
                          <span
                            className={`status ${status.toLowerCase()}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td>
                          {task?.taskDescription ||
                            task?.description ||
                            "-"}
                        </td>

                        <td>
                          <div className="task-actions">
                            <button
                              type="button"
                              className="view-btn"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowModal(true);
                              }}
                            >
                              View
                            </button>

                            <div className="dropdown-container">
                              <button
                                type="button"
                                className="dropdown-btn"
                                aria-label="Task actions"
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown ===
                                      taskKey
                                      ? null
                                      : taskKey
                                  )
                                }
                              >
                                <FaEllipsisV />
                              </button>

                              {openDropdown ===
                                taskKey && (
                                <div className="dropdown-menu">
                                  {status !==
                                    "COMPLETED" && (
                                    <button
                                      type="button"
                                      className="dropdown-item"
                                      disabled={
                                        actionLoading
                                      }
                                      onClick={() =>
                                        handleMarkComplete(
                                          task.id
                                        )
                                      }
                                    >
                                      Complete
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setSelectedTask(
                                        task
                                      );

                                      setShowModal(
                                        true
                                      );

                                      setOpenDropdown(
                                        null
                                      );
                                    }}
                                  >
                                    Update
                                  </button>

                                  <button
                                    type="button"
                                    className="dropdown-item delete"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleDeleteTask(
                                        task.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}

        {showModal && selectedTask && (
          <div
            className="modal-overlay"
            onClick={closeModal}
          >
            <div
              className="modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ✕
              </button>

              <h2>Task Details</h2>

              <div className="modal-body">
                <div className="modal-field">
                  <label>Task Title</label>

                  <p>
                    {selectedTask?.taskTitle ||
                      selectedTask?.title ||
                      "-"}
                  </p>
                </div>

                <div className="modal-field">
                  <label>Employee</label>

                  <p>
                    {selectedTask?.assignedTo
                      ?.name || "-"}{" "}

                    <small>
                      (
                      {selectedTask?.assignedTo
                        ?.employeeId || "-"}
                      )
                    </small>
                  </p>
                </div>

                <div className="modal-field">
                  <label>Priority</label>

                  <p>
                    <span
                      className={`priority ${String(
                        selectedTask?.priority ||
                          ""
                      ).toLowerCase()}`}
                    >
                      {selectedTask?.priority ||
                        "-"}
                    </span>
                  </p>
                </div>

                <div className="modal-field">
                  <label>Due Date</label>

                  <p>
                    {selectedTask?.dueDate || "-"}
                  </p>
                </div>

                <div className="modal-field">
                  <label>Status</label>

                  <div className="status-filter">
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={`status-btn ${
                        selectedTask?.status ===
                        "PENDING"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleStatusChange(
                          selectedTask.id,
                          "PENDING"
                        )
                      }
                    >
                      Pending
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      className={`status-btn ${
                        selectedTask?.status ===
                        "IN_PROGRESS"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleStatusChange(
                          selectedTask.id,
                          "IN_PROGRESS"
                        )
                      }
                    >
                      In Progress
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      className={`status-btn ${
                        selectedTask?.status ===
                        "COMPLETED"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleStatusChange(
                          selectedTask.id,
                          "COMPLETED"
                        )
                      }
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Description</label>

                  <p>
                    {selectedTask?.taskDescription ||
                      selectedTask?.description ||
                      "-"}
                  </p>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="save-btn"
                    onClick={closeModal}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    className="danger-btn"
                    disabled={actionLoading}
                    onClick={() =>
                      handleDeleteTask(
                        selectedTask.id
                      )
                    }
                  >
                    Delete Task
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeModal}
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