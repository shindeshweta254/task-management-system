import { useCallback, useEffect, useState } from "react";

import {
  fetchAllTasks,
  fetchEmployeeTasks,
} from "../api/taskApi";

export function useTasks(user) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const roleName = String(
        user?.role?.roleName || ""
      ).toUpperCase();

      const userId = user?.id;

      let taskData = [];

      const canViewAllTasks =
        roleName === "DIRECTOR" ||
        roleName === "ADMIN" ||
        roleName === "MANAGER";

      if (canViewAllTasks) {
        taskData = await fetchAllTasks();
      } else {
        if (!userId) {
          throw new Error(
            "Logged-in user database ID was not found."
          );
        }

        taskData = await fetchEmployeeTasks(userId);
      }

      setTasks(
        Array.isArray(taskData) ? taskData : []
      );
    } catch (loadError) {
      console.error("Task loading error:", loadError);

      setTasks([]);
      setError(
        loadError?.message ||
          "Tasks could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role?.roleName]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    reload: loadTasks,
  };
}