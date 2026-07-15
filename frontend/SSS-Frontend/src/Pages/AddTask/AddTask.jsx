import Layout from "../../components/Layout/Layout";
import "./AddTask.css";
import { useNavigate } from "react-router-dom";

import { createTask } from "../../api/createTaskApi";
import { useCreateTask } from "../../hooks/useCreateTask";
import { getUserFromStorage } from "../../utils/userStorage";

function AddTask() {
  const navigate = useNavigate();

  const user = getUserFromStorage("user");

  const {
    employees,
    message,
    setMessage,
    task,
    setTask,
    init,
    handleChange,
  } = useCreateTask();

  // keep existing UI/behavior: load employees on mount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ;(function () {})();
  // manual init with lazy pattern to avoid changing hook structure further
  // (init is called right below using microtask)
  Promise.resolve().then(() => init());

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedEmployeeId = Number(task.assignedToId);
    const reviewerUserId = task.reviewerId ? Number(task.reviewerId) : null;

    const requestBody = {
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      priority: task.priority,
      status: task.status,
      progressPercentage: Number(task.progressPercentage) || 0,
      startDate: task.startDate ? task.startDate : null,
      dueDate: task.dueDate ? task.dueDate : null,
      assignedTo: {
        id: selectedEmployeeId,
      },
      reviewer: reviewerUserId ? { id: reviewerUserId } : null,
    };

    try {
      await createTask(requestBody);
      setMessage("Task Created Successfully ✅");

      setTimeout(() => {
        navigate("/task");
      }, 1200);
    } catch (error) {
      setMessage("Backend server not connected ❌");
    }
  };

  return (
    <Layout title="Add Task">
      <div className="add-task-page">
        <div className="add-task-card">
          <h2>Create New Task</h2>
          <p>Assign task to employee from database</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                name="taskTitle"
                value={task.taskTitle}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label>Task Description</label>
              <textarea
                name="taskDescription"
                value={task.taskDescription}
                onChange={handleChange}
                placeholder="Enter task description"
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assign To</label>
                <select
                  name="assignedToId"
                  value={task.assignedToId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.employeeId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reviewer</label>
                <select
                  name="reviewerId"
                  value={task.reviewerId}
                  onChange={handleChange}
                >
                  <option value="">Select Reviewer</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.employeeId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={task.status}
                  onChange={handleChange}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={task.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="create-task-btn">
              Create Task
            </button>

            {message && <p className="task-message">{message}</p>}
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default AddTask;

