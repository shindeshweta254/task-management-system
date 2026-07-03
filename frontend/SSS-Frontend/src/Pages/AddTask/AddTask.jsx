import Layout from "../../Components/Layout/Layout";
import "./AddTask.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AddTask() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");

  const [task, setTask] = useState({
    taskTitle: "",
    taskDescription: "",
    priority: "MEDIUM",
    status: "PENDING",
    progressPercentage: 0,
    startDate: "",
    dueDate: "",
    assignedToId: "",
    reviewerId: "",
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/users")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.log(err));
  }, []);

  const handleChange = (e) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestBody = {
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      priority: task.priority,
      status: task.status,
      progressPercentage: Number(task.progressPercentage),
      startDate: task.startDate,
      dueDate: task.dueDate,
      assignedTo: {
        id: Number(task.assignedToId),
      },
      reviewer: task.reviewerId
        ? {
            id: Number(task.reviewerId),
          }
        : null,
    };

    try {
      const response = await fetch("http://localhost:8080/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        setMessage("Task create nahi hua ❌");
        return;
      }

      setMessage("Task Created Successfully ✅");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error) {
      console.log(error);
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