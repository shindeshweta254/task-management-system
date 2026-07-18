import { useMemo, useState } from "react";

import Layout from "../../components/Layout/Layout";
import "./project.css";

import {
  deleteProjectEmployee,
  fetchProjectById,
  updateProjectEmployee,
} from "../../api/projectsApi";

import useProjects from "../../hooks/useProjects";

const isSupportedExcel = (file) => {
  if (!file) return false;

  const fileName = String(file.name || "").toLowerCase();

  return (
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls")
  );
};

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch (error) {
    console.error("Invalid localStorage user:", error);
    return {};
  }
}

function Projects() {
  const user = getLoggedInUser();

  const roleName = String(
    user?.role?.roleName || ""
  ).toUpperCase();

  const isDirector = [
    "DIRECTOR",
    "MANAGER",
    "OWNER",
    "ADMIN",
  ].includes(roleName);

  const projectHook = useProjects() || {};

  const projects = Array.isArray(projectHook.projects)
    ? projectHook.projects
    : [];

  const loading = Boolean(projectHook.loading);
  const uploading = Boolean(projectHook.uploading);

  const hookError =
    typeof projectHook.error === "string"
      ? projectHook.error
      : "";

  const reload =
    typeof projectHook.reload === "function"
      ? projectHook.reload
      : async () => {};

  const uploadExcel =
    typeof projectHook.uploadExcel === "function"
      ? projectHook.uploadExcel
      : async () => {
          throw new Error(
            "Project upload function is unavailable."
          );
        };

  const removeProject =
    typeof projectHook.removeProject === "function"
      ? projectHook.removeProject
      : async () => {
          throw new Error(
            "Project delete function is unavailable."
          );
        };

  const applyProjectUpdate =
    typeof projectHook.applyProjectUpdate === "function"
      ? projectHook.applyProjectUpdate
      : async () => {
          throw new Error(
            "Project update function is unavailable."
          );
        };

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [message, setMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const [excelFile, setExcelFile] = useState(null);

  const [editingProject, setEditingProject] =
    useState(false);

  const [projectName, setProjectName] =
    useState("");

  const [editingEmployeeId, setEditingEmployeeId] =
    useState(null);

  const [editingEmployeeData, setEditingEmployeeData] =
    useState({
      name: "",
      designation: "",
      pNo: "",
    });

  const [showAddEmployee, setShowAddEmployee] =
    useState(false);

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    designation: "",
    pNo: "",
  });

  const fileInputId = useMemo(
    () =>
      `project-excel-${Math.random()
        .toString(16)
        .slice(2)}`,
    []
  );

  const visibleError = hookError || pageError;

  const clearMessages = () => {
    setMessage("");
    setPageError("");
  };

  const openProject = async (projectId) => {
    clearMessages();

    try {
      const project = await fetchProjectById(projectId);

      if (!project || typeof project !== "object") {
        throw new Error(
          "Project details were not returned."
        );
      }

      setSelectedProject(project);
      setProjectName(project?.siteName || "");
      setEditingProject(false);
      setEditingEmployeeId(null);
      setShowAddEmployee(false);
    } catch (error) {
      console.error(
        "[Projects] openProject failed:",
        error
      );

      setPageError(
        error?.message ||
          "Project details load nahi hue."
      );
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!excelFile) {
      setMessage("⚠️ Pehle Excel file select karo.");
      return;
    }

    if (!isSupportedExcel(excelFile)) {
      setMessage(
        "⚠️ Sirf .xlsx ya .xls file select karo."
      );
      return;
    }

    setMessage("Uploading projects Excel... ⏳");

    try {
      await uploadExcel(excelFile);

      setMessage(
        "✅ Projects imported successfully."
      );

      setExcelFile(null);

      if (event?.currentTarget?.reset) {
        event.currentTarget.reset();
      }

      await reload();
    } catch (error) {
      console.error(
        "[Projects] upload failed:",
        error
      );

      setMessage("");

      setPageError(
        error?.message || "Project upload failed."
      );
    }
  };

  const saveProjectName = async () => {
    if (!selectedProject?.id) return;

    clearMessages();

    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setPageError("Project name required hai.");
      return;
    }

    try {
      const payload = {
        ...selectedProject,
        siteName: trimmedName,
      };

      const updatedProject =
        await applyProjectUpdate(
          selectedProject.id,
          payload
        );

      setSelectedProject(
        updatedProject &&
          typeof updatedProject === "object"
          ? updatedProject
          : payload
      );

      setEditingProject(false);
      setMessage("✅ Project updated.");
      await reload();
    } catch (error) {
      console.error(
        "[Projects] project update failed:",
        error
      );

      setPageError(
        error?.message || "Project update failed."
      );
    }
  };

  const deleteProjectById = async (projectId) => {
    const confirmed = window.confirm(
      "Kya aap ye project delete karna chahte hain?"
    );

    if (!confirmed) return;

    clearMessages();
    setMessage("Deleting project... ⏳");

    try {
      await removeProject(projectId);

      setSelectedProject(null);
      setEditingProject(false);
      setMessage("✅ Project deleted.");
      await reload();
    } catch (error) {
      console.error(
        "[Projects] project delete failed:",
        error
      );

      setMessage("");

      setPageError(
        error?.message || "Project delete failed."
      );
    }
  };

  const startEmployeeEdit = (employee) => {
    setEditingEmployeeId(employee?.id);

    setEditingEmployeeData({
      name: employee?.name || "",
      designation: employee?.designation || "",
      pNo: employee?.pNo || "",
    });
  };

  const saveEmployee = async (employeeId) => {
    if (!selectedProject?.id || !employeeId) return;

    clearMessages();

    try {
      await updateProjectEmployee(
        selectedProject.id,
        employeeId,
        {
          name: editingEmployeeData.name.trim(),
          designation:
            editingEmployeeData.designation.trim(),
          pNo: editingEmployeeData.pNo.trim(),
        }
      );

      setEditingEmployeeId(null);

      await openProject(selectedProject.id);

      setMessage("✅ Employee updated.");
    } catch (error) {
      console.error(
        "[Projects] employee update failed:",
        error
      );

      setPageError(
        error?.message ||
          "Employee update failed."
      );
    }
  };

  const deleteEmployee = async (employeeId) => {
    if (!selectedProject?.id || !employeeId) return;

    const confirmed = window.confirm(
      "Kya aap employee ko project se delete karna chahte hain?"
    );

    if (!confirmed) return;

    clearMessages();
    setMessage("Deleting employee... ⏳");

    try {
      await deleteProjectEmployee(employeeId);

      await openProject(selectedProject.id);

      setMessage("✅ Employee deleted.");
    } catch (error) {
      console.error(
        "[Projects] employee delete failed:",
        error
      );

      setMessage("");

      setPageError(
        error?.message ||
          "Employee delete failed."
      );
    }
  };

  const addEmployee = async (event) => {
    event.preventDefault();

    if (!selectedProject?.id) return;

    clearMessages();

    const employeeToAdd = {
      name: newEmployee.name.trim(),
      designation:
        newEmployee.designation.trim(),
      pNo: newEmployee.pNo.trim(),
    };

    if (!employeeToAdd.name) {
      setPageError("Employee name required hai.");
      return;
    }

    try {
      const currentEmployees = Array.isArray(
        selectedProject?.employees
      )
        ? selectedProject.employees
        : [];

      const payload = {
        ...selectedProject,
        employees: [
          ...currentEmployees,
          employeeToAdd,
        ],
      };

      await applyProjectUpdate(
        selectedProject.id,
        payload
      );

      setNewEmployee({
        name: "",
        designation: "",
        pNo: "",
      });

      setShowAddEmployee(false);

      await openProject(selectedProject.id);

      setMessage("✅ Employee added.");
    } catch (error) {
      console.error(
        "[Projects] add employee failed:",
        error
      );

      setPageError(
        error?.message ||
          "Employee add failed."
      );
    }
  };

  return (
    <Layout title="Projects">
      <div className="proj-page">
        {isDirector && (
          <section className="proj-upload-card">
            <h3>📤 Upload Projects Excel</h3>

            <div className="proj-upload-row">
              <form
                onSubmit={handleUpload}
                className="proj-upload-form"
              >
                <input
                  id={fileInputId}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) =>
                    setExcelFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />

                <button
                  type="submit"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload"}
                </button>
              </form>

              <a
                className="proj-sample-btn"
                href="/project-sample.xlsx"
                download="project-sample.xlsx"
              >
                ⬇️ Download Sample Excel
              </a>
            </div>

            {visibleError && (
              <p className="proj-upload-error">
                {visibleError}
              </p>
            )}

            {message && (
              <p className="proj-upload-msg">
                {message}
              </p>
            )}
          </section>
        )}

        {selectedProject ? (
          <section className="proj-detail">
            <button
              type="button"
              className="proj-back-btn"
              onClick={() => {
                setSelectedProject(null);
                clearMessages();
              }}
            >
              ← Back
            </button>

            <div className="proj-detail-header">
              {editingProject ? (
                <div className="proj-edit-name">
                  <input
                    value={projectName}
                    onChange={(event) =>
                      setProjectName(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    className="act-btn act-save"
                    onClick={saveProjectName}
                  >
                    💾 Save
                  </button>

                  <button
                    type="button"
                    className="act-btn act-cancel"
                    onClick={() => {
                      setEditingProject(false);
                      setProjectName(
                        selectedProject?.siteName ||
                          ""
                      );
                    }}
                  >
                    ✖
                  </button>
                </div>
              ) : (
                <div className="proj-title-row">
                  <div>
                    <h2>
                      🏗️{" "}
                      {selectedProject?.siteName ||
                        "Unnamed Project"}
                    </h2>

                    <p className="proj-emp-count">
                      👥 Total:{" "}
                      {Array.isArray(
                        selectedProject?.employees
                      )
                        ? selectedProject.employees
                            .length
                        : 0}{" "}
                      members
                    </p>
                  </div>

                  {isDirector && (
                    <div className="proj-title-actions">
                      <button
                        type="button"
                        className="act-btn act-edit"
                        onClick={() => {
                          setProjectName(
                            selectedProject?.siteName ||
                              ""
                          );
                          setEditingProject(true);
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        className="act-btn act-del"
                        onClick={() =>
                          deleteProjectById(
                            selectedProject.id
                          )
                        }
                      >
                        🗑 Delete Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="proj-sheet-name">
                Sheet:{" "}
                {selectedProject?.sheetName || "-"}
              </p>
            </div>

            {isDirector && (
              <div className="proj-add-emp">
                {showAddEmployee ? (
                  <form
                    onSubmit={addEmployee}
                    className="proj-add-form"
                  >
                    <input
                      required
                      placeholder="Employee Name"
                      value={newEmployee.name}
                      onChange={(event) =>
                        setNewEmployee({
                          ...newEmployee,
                          name: event.target.value,
                        })
                      }
                    />

                    <input
                      placeholder="Designation"
                      value={newEmployee.designation}
                      onChange={(event) =>
                        setNewEmployee({
                          ...newEmployee,
                          designation:
                            event.target.value,
                        })
                      }
                    />

                    <input
                      placeholder="P.No"
                      value={newEmployee.pNo}
                      onChange={(event) =>
                        setNewEmployee({
                          ...newEmployee,
                          pNo: event.target.value,
                        })
                      }
                    />

                    <button
                      type="submit"
                      className="act-btn act-save"
                    >
                      ➕ Add
                    </button>

                    <button
                      type="button"
                      className="act-btn act-cancel"
                      onClick={() => {
                        setShowAddEmployee(false);
                        setNewEmployee({
                          name: "",
                          designation: "",
                          pNo: "",
                        });
                      }}
                    >
                      ✖
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="proj-add-btn"
                    onClick={() =>
                      setShowAddEmployee(true)
                    }
                  >
                    ➕ Add Employee
                  </button>
                )}
              </div>
            )}

            <div className="proj-table-wrap">
              <table className="proj-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>P.No</th>

                    {isDirector && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {!Array.isArray(
                    selectedProject?.employees
                  ) ||
                  selectedProject.employees.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={isDirector ? 5 : 4}
                        className="proj-empty"
                      >
                        No employees
                      </td>
                    </tr>
                  ) : (
                    selectedProject.employees.map(
                      (employee, index) => (
                        <tr
                          key={
                            employee?.id ?? index
                          }
                        >
                          <td>{index + 1}</td>

                          {editingEmployeeId ===
                          employee?.id ? (
                            <>
                              <td>
                                <input
                                  className="edit-input"
                                  value={
                                    editingEmployeeData.name
                                  }
                                  onChange={(event) =>
                                    setEditingEmployeeData(
                                      {
                                        ...editingEmployeeData,
                                        name: event
                                          .target.value,
                                      }
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  className="edit-input"
                                  value={
                                    editingEmployeeData.designation
                                  }
                                  onChange={(event) =>
                                    setEditingEmployeeData(
                                      {
                                        ...editingEmployeeData,
                                        designation:
                                          event.target
                                            .value,
                                      }
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  className="edit-input"
                                  value={
                                    editingEmployeeData.pNo
                                  }
                                  onChange={(event) =>
                                    setEditingEmployeeData(
                                      {
                                        ...editingEmployeeData,
                                        pNo: event
                                          .target.value,
                                      }
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="act-btn act-save"
                                  onClick={() =>
                                    saveEmployee(
                                      employee.id
                                    )
                                  }
                                >
                                  💾
                                </button>

                                <button
                                  type="button"
                                  className="act-btn act-cancel"
                                  onClick={() =>
                                    setEditingEmployeeId(
                                      null
                                    )
                                  }
                                >
                                  ✖
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                {employee?.name || "-"}
                              </td>

                              <td>
                                {employee?.designation ||
                                  "-"}
                              </td>

                              <td>
                                {employee?.pNo || "-"}
                              </td>

                              {isDirector && (
                                <td>
                                  <button
                                    type="button"
                                    className="act-btn act-edit"
                                    onClick={() =>
                                      startEmployeeEdit(
                                        employee
                                      )
                                    }
                                  >
                                    ✏️
                                  </button>

                                  <button
                                    type="button"
                                    className="act-btn act-del"
                                    disabled={!employee?.id}
                                    onClick={() =>
                                      deleteEmployee(
                                        employee.id
                                      )
                                    }
                                  >
                                    🗑
                                  </button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <>
            <h2 className="proj-heading">
              🏗️ All Projects / Sites
            </h2>

            {visibleError && !isDirector && (
              <p className="proj-upload-error">
                {visibleError}
              </p>
            )}

            {loading ? (
              <p className="proj-loading">
                Loading projects...
              </p>
            ) : projects.length === 0 ? (
              <div className="proj-empty-state">
                <div className="proj-empty-icon">
                  🏗️
                </div>

                <p>
                  Koi saved project nahi mila.
                </p>

                {isDirector && (
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: 14,
                      marginTop: 4,
                    }}
                  >
                    Upar se Excel upload karo.
                  </p>
                )}
              </div>
            ) : (
              <div className="proj-grid">
                {projects.map(
                  (project, index) => (
                    <button
                      type="button"
                      key={
                        project?.id ??
                        project?.siteName ??
                        index
                      }
                      className="proj-card"
                      onClick={() =>
                        openProject(project.id)
                      }
                    >
                      <div className="proj-card-icon">
                        🏗️
                      </div>

                      <h3>
                        {project?.siteName ||
                          "Unnamed Project"}
                      </h3>

                      <p className="proj-card-sheet">
                        {project?.sheetName || "-"}
                      </p>

                      <p className="proj-card-count">
                        👥{" "}
                        {Array.isArray(
                          project?.employees
                        )
                          ? project.employees.length
                          : 0}{" "}
                        members
                      </p>

                      <span className="proj-card-btn">
                        View Team →
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default Projects;