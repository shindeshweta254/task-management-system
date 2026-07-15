import { useState } from "react";
import { fetchAllUsers } from "../api/userApi";

export function useCreateTask() {
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");

  const init = async () => {
    const data = await fetchAllUsers();
    setEmployees(Array.isArray(data) ? data : []);
  };

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

  const handleChange = (e) => {
    setTask((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return { employees, message, setMessage, task, setTask, init, handleChange };
}

