import { useCallback, useEffect, useState } from "react";
import {
  deleteProject,
  fetchAllProjects,
  importProjectsFromExcel,
  updateProject,
} from "../api/projectsApi";

const normalizeErrorMessage = (err) => {
  const msg = err?.message;
  if (!msg) return "Something went wrong";
  // Avoid dumping raw JSON / stack traces
  if (typeof msg === "string") return msg.replace(/\n+/g, " ").slice(0, 140);
  return "Something went wrong";
};

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjects([]);
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const uploadExcel = useCallback(
    async (file) => {
      if (!file) return;
      setUploading(true);
      setError("");
      try {
        await importProjectsFromExcel(file);
        // Critical: reload from backend so list is persistent across refresh
        await reload();
      } catch (err) {
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [reload]
  );

  const removeProject = useCallback(
    async (id) => {
      setError("");
      await deleteProject(id);
      // Critical: reload from backend so deletion persists across refresh
      await reload();
    },
    [reload]
  );

  const applyProjectUpdate = useCallback(
    async (id, payload) => {
      const updated = await updateProject(id, payload);
      // Keep list in sync; backend is source of truth
      await reload();
      return updated;
    },
    [reload]
  );

  return {
    projects,
    loading,
    uploading,
    error,
    reload,
    uploadExcel,
    removeProject,
    applyProjectUpdate,
  };
}

