import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaUsers,
  FaCalendarCheck,
  FaTasks,
  FaCheckCircle,
  FaHourglassHalf,
  FaFlag,
  FaUserPlus,
  FaFileExcel,
  FaSyncAlt,
} from "react-icons/fa";

import Layout from "../../components/Layout/Layout";
import "./DirectorDashboard.css";

import ExcelUploadHistoryTable from "./components/ExcelUploadHistoryTable";
import ExcelViewModal from "./components/ExcelViewModal";

import {
  downloadStaffExcel,
  fetchStaffExcelRows,
  fetchStaffUploadsAll,
  fetchStaffUploadsBySite,
  fetchStaffUploadsMy,
  uploadStaffHistory,
} from "../../api/excelUploadHistoryApi";

const API_BASE_URL = "http://localhost:8080";

const INITIAL_STATS = {
  totalEmployees: 0,
  todayAttendance: 0,
  pendingTasks: 0,
  completedTasks: 0,
  totalTasks: 0,
  deadlines: 0,
};

function DirectorDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = searchParams.get("tab") || "dashboard";

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch (error) {
      console.error("Invalid localStorage user:", error);
      return {};
    }
  }, []);

  const userName = user?.name || "Director";
  const employeeId = user?.employeeId || "-";
  const department = user?.department || "-";

  const initials = useMemo(() => {
    const nameParts = String(userName)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }

    return nameParts[0]?.[0]?.toUpperCase() || "D";
  }, [userName]);

  const [stats, setStats] = useState(INITIAL_STATS);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employeeId: "",
    email: "",
    contactNo: "",
    department: "",
    role: "EMPLOYEE",
  });

  const [employeeMessage, setEmployeeMessage] = useState("");

  const [staffExcelFile, setStaffExcelFile] = useState(null);
  const [staffExcelMessage, setStaffExcelMessage] = useState("");

  const roleName = user?.role?.roleName || "";
  const roleUpper = String(roleName).toUpperCase();
  const isDirectorLike =
    roleUpper === "DIRECTOR" || roleUpper === "OWNER/ADMIN";
  const isSupervisor = roleUpper === "SUPERVISOR";

  const [staffUploads, setStaffUploads] = useState([]);

  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [excelModalTitle, setExcelModalTitle] = useState("");
  const [excelModalTable, setExcelModalTable] = useState([]);
  const [historyBusy, setHistoryBusy] = useState(false);

  const readResponse = async (response, fallbackValue) => {
    const responseText = await response.text();

    if (!response.ok) {
      let readableMessage = `Request failed with status ${response.status}`;

      if (responseText) {
        try {
          const errorObject = JSON.parse(responseText);
          readableMessage =
            errorObject?.message ||
            errorObject?.error ||
            readableMessage;
        } catch {
          if (responseText.length < 250) {
            readableMessage = responseText;
          }
        }
      }
      throw new Error(readableMessage);
    }

    if (!responseText) {
      return fallbackValue;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText;
    }
  };

  const safeFetch = async (url, fallbackValue) => {
    try {
      const response = await fetch(url);
      return await readResponse(response, fallbackValue);
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      return fallbackValue;
    }
  };

  const fetchAllTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/all`);
      return await readResponse(response, []);
    } catch (error) {
      console.error("All tasks API failed:", error);
      return [];
    }
  };

  const calculateTodayAttendance = () => {
    try {
      const attendanceData =
        JSON.parse(localStorage.getItem("attendanceData")) || [];
      const today = new Date().toLocaleDateString("en-IN");
      return attendanceData.filter(
        (attendance) =>
          attendance?.date === today && attendance?.punchIn
      ).length;
    } catch (error) {
      console.error("Attendance calculation error:", error);
      return 0;
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    if (searchParams.get("tab") !== "dashboard") {
      setSearchParams({ tab: "dashboard" });
    }

    try {
      const [
        usersData,
        tasksData,
        totalTasksCount,
        pendingTasksCount,
        completedTasksCount,
        deadlineTasksCount,
      ] = await Promise.all([
        safeFetch(`${API_BASE_URL}/api/users`, []),
        fetchAllTasks(),
        safeFetch(`${API_BASE_URL}/api/tasks/count/total`, 0),
        safeFetch(`${API_BASE_URL}/api/tasks/count/pending`, 0),
        safeFetch(`${API_BASE_URL}/api/tasks/count/completed`, 0),
        safeFetch(`${API_BASE_URL}/api/tasks/deadline-today`, 0),
      ]);

      const validEmployees = Array.isArray(usersData) ? usersData : [];
      const validTasks = Array.isArray(tasksData) ? tasksData : [];

      setEmployees(validEmployees);
      setTasks(validTasks);

      setStats({
        totalEmployees: validEmployees.length,
        todayAttendance: calculateTodayAttendance(),
        pendingTasks:
          Number(pendingTasksCount) ||
          validTasks.filter(
            (task) => String(task?.status).toUpperCase() === "PENDING"
          ).length,
        completedTasks:
          Number(completedTasksCount) ||
          validTasks.filter(
            (task) => String(task?.status).toUpperCase() === "COMPLETED"
          ).length,
        totalTasks: Number(totalTasksCount) || validTasks.length,
        deadlines: Number(deadlineTasksCount) || 0,
      });
    } catch (error) {
      console.error("Director dashboard loading error:", error);
      setPageError("Dashboard data load nahi hua. Backend API check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setEmployeeMessage("Saving employee...");

    try {
      const employeeIdValue = newEmployee.employeeId.trim();

      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmployee.name.trim(),
          employeeId: employeeIdValue,
          email: newEmployee.email.trim(),
          contactNo: newEmployee.contactNo.trim() || null,
          department: newEmployee.department.trim(),
          password: `${employeeIdValue}@123`,
          status: "ACTIVE",
          role: { roleName: newEmployee.role },
        }),
      });

      await readResponse(response, "Employee added successfully");

      setEmployeeMessage("Employee added successfully ✅");

      setNewEmployee({
        name: "",
        employeeId: "",
        email: "",
        contactNo: "",
        department: "",
        role: "EMPLOYEE",
      });

      await loadDashboardData();
    } catch (error) {
      console.error("Add employee error:", error);
      setEmployeeMessage(error?.message || "Employee add nahi hua ❌");
    }
  };

  const loadExcelHistories = async () => {
    try {
      const userId = user?.id || user?.userId;
      const siteName = user?.siteName || user?.site || "";

      if (isDirectorLike) {
        const staffAll = await fetchStaffUploadsAll();
        setStaffUploads(staffAll);
        return;
      }

      if (isSupervisor) {
        const staffBySite = await fetchStaffUploadsBySite(siteName);
        setStaffUploads(staffBySite);
        return;
      }

      const staffMy = await fetchStaffUploadsMy(userId);
      setStaffUploads(staffMy);
    } catch (e) {
      console.error("Failed to load excel upload histories", e);
    }
  };

  useEffect(() => {
    loadExcelHistories();
  }, []);

  const handleStaffExcelUpload = async (event) => {
    event.preventDefault();

    if (!staffExcelFile) {
      setStaffExcelMessage("Please select a staff Excel file.");
      return;
    }

    setStaffExcelMessage("Uploading staff Excel...");

    const formData = new FormData();
    formData.append("file", staffExcelFile);

    const uploadedByUserId = user?.id || user?.userId;
    const uploadedByName = user?.name || "";
    const uploadedByRole = user?.role?.roleName || "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/import-staff`, {
        method: "POST",
        body: formData,
      });

      const result = await readResponse(response, "Excel import successful");

      await uploadStaffHistory({
        file: staffExcelFile,
        uploadedByUserId,
        uploadedByName,
        uploadedByRole,
      });

      setStaffExcelMessage(`✅ ${String(result)}`);
      setStaffExcelFile(null);

      await Promise.all([loadDashboardData(), loadExcelHistories()]);
    } catch (error) {
      console.error("Staff Excel upload error:", error);

      try {
        if (staffExcelFile) {
          await uploadStaffHistory({
            file: staffExcelFile,
            uploadedByUserId,
            uploadedByName,
            uploadedByRole,
          });
        }
      } catch (e) {
        console.error("Failed to save failed staff upload history", e);
      }

      setStaffExcelMessage(`❌ ${error?.message || "Upload failed"}`);
    }
  };

  const openExcelModal = async ({ type, id }) => {
    setExcelModalOpen(true);
    setExcelModalTable([]);
    setHistoryBusy(true);

    try {
      const rows = await fetchStaffExcelRows(id);
      setExcelModalTitle("Staff Allocation Details");
      setExcelModalTable(rows);
    } catch (e) {
      console.error("Failed to load excel rows", e);
      setExcelModalTable([]);
    } finally {
      setHistoryBusy(false);
    }
  };

  const downloadExcel = async (type, id) => {
    const blob = await downloadStaffExcel(id);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const directorTabs = [];

  return (
    <Layout title="Director Dashboard">
      <main className="director-dashboard-page">
        <div className="director-tabs">
          <div className="director-tabs-scroll">
            {directorTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`director-tab-button ${
                  activeSection === tab.key ? "active" : ""
                }`}
                onClick={tab.onClick}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="director-refresh-button"
            onClick={loadDashboardData}
            title="Refresh dashboard"
          >
            <FaSyncAlt />
          </button>
        </div>

        {pageError && (
          <div className="director-error-message">{pageError}</div>
        )}

        {loading && (
          <div className="director-loading-message">
            Loading Director Dashboard...
          </div>
        )}

        {!loading && activeSection === "dashboard" && (
          <>
            <section className="director-hero">
              <div className="director-user-info">
                <div className="director-avatar">{initials}</div>
                <div>
                  <h1>
                    Welcome, {userName}! <span>👋</span>
                  </h1>
                  <p>
                    ID: {employeeId}
                    <span>|</span>
                    Dept: {department}
                    <span>|</span>
                    Role: DIRECTOR
                  </p>
                </div>
              </div>
              <img
                src="/logo.png"
                alt="SSS FMS Logo"
                className="director-hero-logo"
              />
            </section>

            <section className="director-stats-grid">
              <StatsCard type="employees" icon={<FaUsers />} value={stats.totalEmployees} label="Total Employees" />
              <StatsCard type="attendance" icon={<FaCalendarCheck />} value={stats.todayAttendance} label="Today's Attendance" />
              <StatsCard type="pending" icon={<FaHourglassHalf />} value={stats.pendingTasks} label="Pending Tasks" />
              <StatsCard type="completed" icon={<FaCheckCircle />} value={stats.completedTasks} label="Completed Tasks" />
              <StatsCard type="deadlines" icon={<FaFlag />} value={stats.deadlines} label="Today's Deadlines" />
              <StatsCard type="tasks" icon={<FaTasks />} value={stats.totalTasks} label="Total Tasks" />
            </section>
          </>
        )}

        {!loading && activeSection === "employees" && (
          <section className="director-card">
            <div className="director-card-heading">
              <div>
                <h2>All Employees</h2>
                <p>{employees.length} employees found</p>
              </div>
            </div>
            <EmployeeTable employees={employees} />
          </section>
        )}

        {!loading && activeSection === "tasks" && (
          <section className="director-card">
            <div className="director-card-heading">
              <div>
                <h2>All Tasks</h2>
                <p>{tasks.length} tasks found</p>
              </div>
              <button type="button" onClick={() => navigate("/add-task")}>
                Add Task
              </button>
            </div>
            <TaskTable tasks={tasks} />
          </section>
        )}

        {!loading && activeSection === "add-employee" && (
          <section className="director-card">
            <div className="director-card-heading">
              <div>
                <h2>Add Employee</h2>
                <p>Create a new employee account</p>
              </div>
            </div>

            <form className="director-form" onSubmit={handleAddEmployee}>
              <label>
                Full Name
                <input
                  required
                  type="text"
                  placeholder="Enter full name"
                  value={newEmployee.name}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, name: event.target.value })
                  }
                />
              </label>
              <label>
                Employee ID
                <input
                  required
                  type="text"
                  placeholder="Example: FMS001"
                  value={newEmployee.employeeId}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, employeeId: event.target.value })
                  }
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  placeholder="Enter email"
                  value={newEmployee.email}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, email: event.target.value })
                  }
                />
              </label>
              <label>
                Contact Number
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={newEmployee.contactNo}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, contactNo: event.target.value })
                  }
                />
              </label>
              <label>
                Department
                <input
                  type="text"
                  placeholder="Enter department"
                  value={newEmployee.department}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, department: event.target.value })
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={newEmployee.role}
                  onChange={(event) =>
                    setNewEmployee({ ...newEmployee, role: event.target.value })
                  }
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="DIRECTOR">Director</option>
                </select>
              </label>
              <button type="submit" className="director-primary-button">
                Add Employee
              </button>
            </form>

            {employeeMessage && (
              <p className="director-message">{employeeMessage}</p>
            )}
          </section>
        )}

        {!loading && activeSection === "upload-excel" && (
          <>
            <section className="director-upload-grid">
              <article className="director-card no-margin">
                <h2>Upload Staff Excel</h2>
                <p className="director-help-text">
                  Name | Emp ID | Department | Mobile | DOJ | Designation | Gender | Email | DOB
                </p>
                <form className="director-upload-form" onSubmit={handleStaffExcelUpload}>
                  <input
                    key={staffExcelMessage}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      setStaffExcelFile(event.target.files?.[0] || null)
                    }
                  />
                  <button type="submit">Upload Staff Excel</button>
                </form>
                {staffExcelMessage && (
                  <p className="director-message">{staffExcelMessage}</p>
                )}
              </article>
            </section>

            <section className="director-card" style={{ marginTop: 17, padding: 18 }}>
              <h2 style={{ margin: 0, marginBottom: 10 }}>Uploaded Staff Excel Files</h2>
              <ExcelUploadHistoryTable
                rows={staffUploads}
                type="STAFF"
                onView={(id) => openExcelModal({ type: "STAFF", id })}
                onDownload={(id) => downloadExcel("STAFF", id)}
              />
            </section>

            <ExcelViewModal
              open={excelModalOpen}
              title={excelModalTitle}
              rows={excelModalTable}
              loading={historyBusy}
              onClose={() => setExcelModalOpen(false)}
            />
          </>
        )}
      </main>
    </Layout>
  );
}

function StatsCard({ type, icon, value, label }) {
  return (
    <article className={`director-stat-card ${type}`}>
      <div className="director-stat-icon">{icon}</div>
      <div>
        <h2>{value}</h2>
        <p>{label}</p>
      </div>
    </article>
  );
}

function EmployeeTable({ employees }) {
  return (
    <div className="director-table-wrapper">
      <table className="director-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, idx) => (
            <tr key={emp?.id || idx}>
              <td>{emp?.name || "-"}</td>
              <td>{emp?.employeeId || "-"}</td>
              <td>{emp?.email || "-"}</td>
              <td>{emp?.department || "-"}</td>
              <td>{emp?.role?.roleName || emp?.role || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskTable({ tasks }) {
  return (
    <div className="director-table-wrapper">
      <table className="director-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, idx) => (
            <tr key={task?.id || idx}>
              <td>{task?.taskTitle || task?.title || "-"}</td>
              <td>{task?.status || "-"}</td>
              <td>{task?.assignedTo?.name || task?.assignedTo || "-"}</td>
              <td>{task?.dueDate || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DirectorDashboard;





