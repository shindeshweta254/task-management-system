import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./project.css";

import { 
  deleteProject, 
  fetchAllProjects, 
  fetchProjectById, 
  importProjectsFromExcel,
  deleteProjectEmployee,
  updateProjectEmployee,
  updateProject
} from "../../api/projectsApi";

const API = "http://localhost:8080/api/projects";

function Projects() {
  // Centralized localStorage access (no changes to route/APIs)
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role?.roleName || "";
  const isDirector = ["DIRECTOR", "MANAGER", "OWNER"].includes(String(role).toUpperCase());


  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");


  // Upload
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Edit project name
  const [editingProject, setEditingProject] = useState(false);
  const [projName, setProjName] = useState("");

  // Edit employee
  const [editEmpId, setEditEmpId] = useState(null);
  const [editEmpData, setEditEmpData] = useState({});

  // Add employee
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", designation: "", pNo: "" });

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const data = await fetchAllProjects();
      setProjects(data);
    } catch (err) {
      const readable = err?.message || "Failed to load projects";
      setError(readable);
      console.log("[Projects] fetchProjects failed:", err);
    } finally {
      setLoading(false);
    }
  };


  const openProject = async (id) => {
    setError("");
    setMsg("");
    try {
      const p = await fetchProjectById(id);
      setSelected(p);
      setProjName(p?.siteName || "");
    } catch (err) {
      setError(err?.message || "Failed to load project details");
      console.log("[Projects] openProject failed:", err);
    }
  };


  const handleUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setMsg("⚠️ Pehle file select karo");
      return;
    }

    setUploading(true);
    setError("");
    setMsg("Uploading... ⏳");

    try {
      const result = await importProjectsFromExcel(excelFile);
      setMsg(`✅ ${typeof result === "string" ? result : JSON.stringify(result)}`);
      await fetchProjects();
    } catch (err) {
      const readable = err?.message || "Upload failed";
      setError(readable);
      console.log("[Projects] upload failed:", err);
      setMsg("");
    } finally {
      setUploading(false);
    }
  };


  // Project CRUD
  const saveProjectName = async () => {
    setError("");
    setMsg("");
    try {
      const p = await updateProject(selected.id, { ...selected, siteName: projName });
      setSelected(p);
      setEditingProject(false);
      await fetchProjects();
      setMsg("✅ Project updated");
    } catch (err) {
      const readable = err?.message || "Update failed";
      setError(readable);
      console.log("[Projects] saveProjectName failed:", err);
    }
  };


  const deleteProject = async (id) => {
    if (!window.confirm("Project delete karna chahte ho?")) return;
    setError("");
    setMsg("Deleting... ⏳");
    try {
      await deleteProject(id);
      setSelected(null);
      await fetchProjects();
      setMsg("✅ Project deleted");
    } catch (err) {
      const readable = err?.message || "Delete failed";
      setError(readable);
      console.log("[Projects] deleteProject failed:", err);
      setMsg("");
    }
  };


  // Employee CRUD
  const saveEmployee = async (empId) => {
    setError("");
    setMsg("");
    try {
      await updateProjectEmployee(selected.id, empId, editEmpData);
      setEditEmpId(null);
      await openProject(selected.id);
      setMsg("✅ Employee updated");
    } catch (err) {
      const readable = err?.message || "Employee update failed";
      setError(readable);
      console.log("[Projects] saveEmployee failed:", err);
    }
  };


  const deleteEmployee = async (empId) => {
    if (!window.confirm("Employee delete karna chahte ho?")) return;
    setError("");
    setMsg("Deleting... ⏳");
    try {
      await deleteProjectEmployee(empId);
      await openProject(selected.id);
      setMsg("✅ Employee deleted");
    } catch (err) {
      const readable = err?.message || "Employee delete failed";
      setError(readable);
      console.log("[Projects] deleteEmployee failed:", err);
      setMsg("");
    }
  };


  const addEmployee = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    try {
      const updatedEmps = [...(selected.employees || []), newEmp];
      await updateProject(selected.id, { ...selected, employees: updatedEmps });
      setNewEmp({ name: "", designation: "", pNo: "" });
      setShowAddEmp(false);
      await openProject(selected.id);
      setMsg("✅ Employee added");
    } catch (err) {
      const readable = err?.message || "Add employee failed";
      setError(readable);
      console.log("[Projects] addEmployee failed:", err);
    }
  };


  return (
    <Layout title="Projects">
      <div className="proj-page">

        {/* Upload — director only */}
        {isDirector && (
          <div className="proj-upload-card">
            <h3>📤 Upload Projects Excel</h3>
            <form onSubmit={handleUpload} className="proj-upload-form">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} />
              <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</button>
            </form>
            {msg && <p className="proj-upload-msg">{msg}</p>}
          </div>
        )}

        {/* Detail view */}
        {selected ? (
          <div className="proj-detail">
            <button className="proj-back-btn" onClick={() => setSelected(null)}>← Back</button>

            {/* Project name edit */}
            <div className="proj-detail-header">
              {editingProject ? (
                <div className="proj-edit-name">
                  <input value={projName} onChange={(e) => setProjName(e.target.value)} />
                  <button className="act-btn act-save" onClick={saveProjectName}>💾 Save</button>
                  <button className="act-btn act-cancel" onClick={() => setEditingProject(false)}>✖</button>
                </div>
              ) : (
                <div className="proj-title-row">
                  <h2>🏗️ {selected.siteName}</h2>
                  {isDirector && (
                    <div className="proj-title-actions">
                      <button className="act-btn act-edit" onClick={() => setEditingProject(true)}>✏️ Edit</button>
                      <button className="act-btn act-del" onClick={() => deleteProject(selected.id)}>🗑 Delete Project</button>
                    </div>
                  )}
                </div>
              )}
              <p className="proj-sheet-name">Sheet: {selected.sheetName}</p>
              <p className="proj-emp-count">👥 Total: {selected.employees?.length || 0} members</p>
            </div>

            {/* Add employee */}
            {isDirector && (
              <div className="proj-add-emp">
                {showAddEmp ? (
                  <form onSubmit={addEmployee} className="proj-add-form">
                    <input required placeholder="Employee Name" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} />
                    <input placeholder="Designation" value={newEmp.designation} onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })} />
                    <input placeholder="P.No" value={newEmp.pNo} onChange={(e) => setNewEmp({ ...newEmp, pNo: e.target.value })} />
                    <button type="submit" className="act-btn act-save">➕ Add</button>
                    <button type="button" className="act-btn act-cancel" onClick={() => setShowAddEmp(false)}>✖</button>
                  </form>
                ) : (
                  <button className="proj-add-btn" onClick={() => setShowAddEmp(true)}>➕ Add Employee</button>
                )}
              </div>
            )}

            {/* Employees table */}
            <div className="proj-table-wrap">
              <table className="proj-table">
                <thead>
                  <tr>
                    <th>#</th><th>Employee Name</th><th>Designation</th><th>P.No</th>
                    {isDirector && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {selected.employees?.length === 0
                    ? <tr><td colSpan={isDirector ? 5 : 4} className="proj-empty">No employees</td></tr>
                    : selected.employees?.map((emp, i) => (
                      <tr key={emp.id || i}>
                        <td>{i + 1}</td>
                        {editEmpId === emp.id ? (
                          <>
                            <td><input className="edit-input" value={editEmpData.name} onChange={(e) => setEditEmpData({ ...editEmpData, name: e.target.value })} /></td>
                            <td><input className="edit-input" value={editEmpData.designation} onChange={(e) => setEditEmpData({ ...editEmpData, designation: e.target.value })} /></td>
                            <td><input className="edit-input" value={editEmpData.pNo} onChange={(e) => setEditEmpData({ ...editEmpData, pNo: e.target.value })} /></td>
                            <td>
                              <button className="act-btn act-save" onClick={() => saveEmployee(emp.id)}>💾</button>
                              <button className="act-btn act-cancel" onClick={() => setEditEmpId(null)}>✖</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{emp.name}</td>
                            <td>{emp.designation || "-"}</td>
                            <td>{emp.pNo || "-"}</td>
                            {isDirector && (
                              <td>
                                <button className="act-btn act-edit" onClick={() => { setEditEmpId(emp.id); setEditEmpData({ name: emp.name, designation: emp.designation || "", pNo: emp.pNo || "" }); }}>✏️</button>
                                <button className="act-btn act-del" onClick={() => deleteEmployee(emp.id)}>🗑</button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <h2 className="proj-heading">🏗️ All Projects / Sites</h2>
            {loading ? (
              <p className="proj-loading">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="proj-empty-state">
                <div className="proj-empty-icon">🏗️</div>
                <p>Koi project nahi mila.</p>
                {isDirector && <p>Upar se Excel upload karo.</p>}
              </div>
            ) : (
              <div className="proj-grid">
                {projects.map((proj) => (
                  <div key={proj.id} className="proj-card" onClick={() => openProject(proj.id)}>
                    <div className="proj-card-icon">🏗️</div>
                    <h3>{proj.siteName}</h3>
                    <p className="proj-card-sheet">{proj.sheetName}</p>
                    <p className="proj-card-count">👥 {proj.employees?.length || 0} members</p>
                    <span className="proj-card-btn">View Team →</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Projects;
