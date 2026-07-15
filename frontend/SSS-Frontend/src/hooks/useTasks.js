import { useCallback, useEffect, useState } from "react";
import { fetchAllTasks, fetchEmployeeTasks } from "../api/taskApi";

function isPrivilegedRole(roleName) {
  const r = String(roleName || "").toUpperCase();
  return ["OWNER/ADMIN", "OWNER/ADMINISTRATOR", "OWNER", "ADMIN"].includes(r) || r === "OWNER/ADMIN";
}

export function useTasks(user) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;
  const employeeId = Number(userId);
  const canFetchEmployeeTasks = Number.isFinite(employeeId) && employeeId > 0;
  const isPrivileged = isPrivilegedRole(user?.role?.roleName);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isPrivileged) {
        const data = await fetchAllTasks();
        setTasks(data);
      } else {
        if (!canFetchEmployeeTasks) {
          setTasks([]);
        } else {
          const data = await fetchEmployeeTasks(userId);
          setTasks(Array.isArray(data) ? data : []);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [canFetchEmployeeTasks, isPrivileged, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { tasks, setTasks, loading, reload: load };
}

