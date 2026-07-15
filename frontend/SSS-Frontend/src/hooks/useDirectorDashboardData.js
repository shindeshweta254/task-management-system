import { useEffect, useState } from "react";
import {
  fetchAllUsers,
  fetchDeadlineToday,
  fetchTaskCountCompleted,
  fetchTaskCountPending,
  fetchTaskCountTotal,
  fetchTasksAll,
} from "../api/directorDashboardApi";

function getTodayAttendanceCount() {
  try {
    const attData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    const today = new Date().toLocaleDateString("en-IN");
    return attData.filter((a) => a.date === today && a.punchIn).length;
  } catch {
    return 0;
  }
}

export function useDirectorDashboardData() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    deadlines: 0,
  });

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");

  const [employees, setEmployees] = useState([]);

  const loadAll = async () => {
    try {
      const [users, total, pending, completed, deadlines] = await Promise.all([
        fetchAllUsers(),
        fetchTaskCountTotal(),
        fetchTaskCountPending(),
        fetchTaskCountCompleted(),
        fetchDeadlineToday(),
      ]);

      setEmployees(Array.isArray(users) ? users : []);

      const todayAtt = getTodayAttendanceCount();
      setStats({
        totalEmployees: Array.isArray(users) ? users.length : 0,
        todayAttendance: todayAtt,
        pendingTasks: pending || 0,
        completedTasks: completed || 0,
        totalTasks: total || 0,
        deadlines: deadlines || 0,
      });
    } catch {
      const todayAtt = getTodayAttendanceCount();
      setStats((p) => ({ ...p, todayAttendance: todayAtt }));
    }
  };

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      setTasksError("");
      const data = await fetchTasksAll();
      setTasks(data);
    } catch (e) {
      setTasksError(e?.message || "Error loading tasks");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stats,
    tasks,
    tasksLoading,
    tasksError,
    employees,
    reload: () => {
      loadAll();
      fetchTasks();
    },
    reloadStats: loadAll,
    fetchTasks,
  };
}

