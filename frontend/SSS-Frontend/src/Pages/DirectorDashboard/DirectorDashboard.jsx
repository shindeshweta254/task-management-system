import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaUsers,
  FaCalendarCheck,
  FaTasks,
  FaCheckCircle,
  FaHourglassHalf,
  FaFlag,
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
  // uploadStaffHistory, // This is now handled by apiFetch in excelUploadHistoryApi.js
} from "../../api/excelUploadHistoryApi";

import { deleteAttendanceByMonth } from "../../api/attendanceApi";
import { getAuthHeaders } from "../../api/index";

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
  const [attendance, setAttendance] = useState([]);

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

  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [clearMonth, setClearMonth] = useState("");
  const [clearYear, setClearYear] = useState(new Date().getFullYear());
  const [clearBusy, setClearBusy] = useState(false);
  const [clearMessage, setClearMessage] = useState("");

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
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });

    return await readResponse(response, fallbackValue);
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    return fallbackValue;
  }
};

const fetchAllTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/all`, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });

    return await readResponse(response, []);
  } catch (error) {
    console.error("All tasks API failed:", error);
    return [];
  }
};

const fetchAllAttendanceSafe = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/attendance/director`, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    });

    return await readResponse(response, []);
  } catch (error) {
    console.error("All attendance API failed:", error);
    return [];
  }
};

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    Promise.allSettled([
      safeFetch(`${API_BASE_URL}/api/users`, []),
      fetchAllTasks(),
      fetchAllAttendanceSafe(),
      safeFetch(`${API_BASE_URL}/api/tasks/count/total`, 0),
      safeFetch(`${API_BASE_URL}/api/tasks/count/pending`, 0),
      safeFetch(`${API_BASE_URL}/api/tasks/count/completed`, 0),
      safeFetch(`${API_BASE_URL}/api/tasks/deadline-today`, 0),
    ])
      .then((results) => {
        const [
        usersData,
        tasksData,
        attendanceData,
        totalTasksCount,
        pendingTasksCount,
        completedTasksCount,
        deadlineTasksCount,
      ] = results;

        const extractValue = (result, fallback) =>
          result.status === "fulfilled" ? result.value : fallback;

        const validEmployees = extractValue(usersData, []);
        const validTasks = extractValue(tasksData, []);
        const validAttendance = extractValue(attendanceData, []);

        setEmployees(Array.isArray(validEmployees) ? validEmployees : []);
        setTasks(Array.isArray(validTasks) ? validTasks : []);
        setAttendance(Array.isArray(validAttendance) ? validAttendance : []);

        const todayISO = new Date().toISOString().split("T")[0];
        const todaysAttendanceCount = validAttendance.filter(
          (a) => String(a.date || "").startsWith(todayISO)
        ).length;

        setStats({
          totalEmployees: validEmployees.length,
          todayAttendance: todaysAttendanceCount,
          pendingTasks:
            extractValue(pendingTasksCount, 0) ||
            validTasks.filter((task) => String(task?.status).toUpperCase() === "PENDING").length,
          completedTasks:
            extractValue(completedTasksCount, 0) ||
            validTasks.filter((task) => String(task?.status).toUpperCase() === "COMPLETED").length,
          totalTasks: extractValue(totalTasksCount, 0) || validTasks.length,
          deadlines: extractValue(deadlineTasksCount, 0) || 0,
        });

        // Log any errors without redirecting
        results.forEach((result) => {
          if (result.status === "rejected") {
            console.error("Dashboard API call failed:", result.reason);
            setPageError("Dashboard ke kuch parts load nahi hue. Console check karein.");
          }
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setEmployeeMessage("Saving employee...");

    try {
      const employeeIdValue = newEmployee.employeeId.trim();

      await apiFetch(`${API_BASE_URL}/api/users`, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
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

      // apiFetch handles response parsing and error throwing

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
      const result = await apiFetch(`${API_BASE_URL}/api/users/import-staff`, {
        method: "POST",
        body: formData,
      });

      setStaffExcelMessage(`✅ ${String(result)}`);
      setStaffExcelFile(null);
      await Promise.all([loadDashboardData(), loadExcelHistories()]);
    } catch (error) {
      console.error("Staff Excel upload error:", error);
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

const directorTabs = [
  {
    key: "attendance",
    label: "Attendance",
    icon: <FaCalendarCheck />,
    onClick: () => setSearchParams({ tab: "attendance" }),
  },
];

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

{!loading && activeSection === "attendance" && (
          <section className="director-card">
            <div className="director-card-heading">
              <div>
                <h2>All Attendance</h2>
                <p>{attendance.length} records found</p>
              </div>
              <button
                type="button"
                className="director-clear-data-btn"
                onClick={() => {
                  setClearMessage("");
                  setClearMonth("");
                  setClearDataOpen(true);
                }}
              >
                🗑 Clear Data
              </button>
            </div>

            {clearMessage && (
              <p className="director-message">{clearMessage}</p>
            )}

            <AttendanceTable attendance={attendance} />

            {clearDataOpen && (
              <div
                className="director-modal-overlay"
                onClick={() => {
                  if (!clearBusy) setClearDataOpen(false);
                }}
              >
                <div
                  className="director-modal-content director-clear-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="director-modal-close"
                    onClick={() => {
                      if (!clearBusy) setClearDataOpen(false);
                    }}
                  >
                    &times;
                  </button>

                  <h3>Clear Attendance Data</h3>

                  <label className="director-clear-label">
                    Select Month
                    <select
                      value={clearMonth}
                      onChange={(e) => setClearMonth(e.target.value)}
                      disabled={clearBusy}
                    >
                      <option value="">-- Select Month --</option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((name, i) => (
                        <option key={name} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="director-clear-label">
                    Year
                    <input
                      type="number"
                      value={clearYear}
                      min={2000}
                      max={2100}
                      onChange={(e) => setClearYear(Number(e.target.value))}
                      disabled={clearBusy}
                    />
                  </label>

                  {clearMonth && (
                    <p className="director-clear-confirm">
                      Are you sure you want to permanently delete all attendance
                      records for the selected month? This action cannot be
                      undone.
                    </p>
                  )}

                  <div className="director-clear-actions">
                    <button
                      type="button"
                      className="director-clear-cancel"
                      onClick={() => setClearDataOpen(false)}
                      disabled={clearBusy}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="director-clear-delete"
                      onClick={async () => {
                        if (!clearMonth || clearBusy) return;
                        setClearBusy(true);
                        setClearMessage("");
                        try {
                          const result = await deleteAttendanceByMonth(
                            clearYear,
                            Number(clearMonth)
                          );
                          setClearMessage(
                            `✅ ${String(result)}`
                          );
                          setClearDataOpen(false);
                          setClearMonth("");
                          await loadDashboardData();
                        } catch (error) {
                          console.error("Clear data error:", error);
                          setClearMessage(
                            `❌ ${
                              error?.response?.data?.message ||
                              error?.message ||
                              "Failed to clear attendance data"
                            }`
                          );
                        } finally {
                          setClearBusy(false);
                        }
                      }}
                      disabled={!clearMonth || clearBusy}
                    >
                      {clearBusy ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </div>
              </div>
            )}
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

function AttendanceTable({ attendance }) {
  const [selfieModal, setSelfieModal] = useState(null);

  const formatTime = (time) => {
    if (!time) return "-";
    if (typeof time === "string" && time.length >= 5) return time.substring(0, 5);
    return String(time);
  };

  const formatHours = (hours) => {
    if (hours == null) return "-";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "PRESENT") return <span className="attendance-status present">Present</span>;
    if (s === "LATE") return <span className="attendance-status late">Late</span>;
    if (s === "ABSENT") return <span className="attendance-status absent">Absent</span>;
    if (s === "HALF_DAY") return <span className="attendance-status half-day">Half Day</span>;
    if (s === "HOLIDAY" || s === "WEEK_OFF") return <span className="attendance-status holiday">{status}</span>;
    return <span className="attendance-status">{status || "-"}</span>;
  };

const getLocationText = (item) => {
    // Prefer location from attendance table directly.
    // Do NOT show latitude/longitude anywhere in the UI.
    const loc = item.location || "";
    const addr = item.checkInAddress || item.checkOutAddress || item.latestLiveAddress || "";
    if (loc) return loc;
    if (addr) return addr;
    return "-";
  };

// Build a browser-accessible URL for a stored selfie path.
  // If the path starts with /uploads, prepend the backend origin.
  const getSelfieUrl = (path) => {
    if (!path) return null;
    const raw = String(path).replace(/\\/g, "/").trim();
    if (!raw) return null;
    // Already absolute/data URL -> use as-is
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    // Starts with /uploads -> backend origin + path
    if (raw.startsWith("/uploads")) {
      return `${API_BASE_URL}${raw}`;
    }
    // Relative uploads path -> backend origin + / + path
    if (raw.startsWith("uploads/")) {
      return `${API_BASE_URL}/${raw}`;
    }
    // Leading slash -> backend origin + path
    if (raw.startsWith("/")) {
      return `${API_BASE_URL}${raw}`;
    }
    return raw;
  };

  // Render a single selfie thumbnail with "No Selfie" fallback.
  // Clicking opens the full image preview in a new tab.
  const renderSelfieCell = (path) => {
    const url = getSelfieUrl(path);
    if (!url) {
      return <span className="director-no-selfie">No Selfie</span>;
    }
    return (
      <img
        src={url}
        alt="selfie"
        className="director-selfie-thumb"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        style={{ cursor: "pointer" }}
      />
    );
  };

  return (
    <>
      <div className="director-table-wrapper">
        <table className="director-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Role</th>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
<th>Working Hours</th>
<th>Status</th>
              <th>Location</th>
              <th>Punch In Selfie</th>
              <th>Punch Out Selfie</th>
            </tr>
          </thead>
          <tbody>
{attendance.length === 0 ? (
              <tr>
                <td colSpan={11} className="director-empty-cell">
                  No attendance records found
                </td>
              </tr>
            ) : (
              attendance.map((item, idx) => {
                return (
                  <tr key={item.attendanceId || item.id || idx}>
                    <td>{item.employeeName || "-"}</td>
                    <td>{item.employeeId || "-"}</td>
                    <td>{item.roleName || "-"}</td>
                    <td>{item.date ? String(item.date).substring(0, 10) : "-"}</td>
                    <td>{formatTime(item.checkInTime)}</td>
                    <td>{formatTime(item.checkOutTime)}</td>
                    <td>{formatHours(item.workingHours)}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td className="location-cell" title={getLocationText(item)}>
                      {getLocationText(item)}
                    </td>
                    <td>{renderSelfieCell(item.checkInSelfiePath || item.checkInSelfieUrl)}</td>
                    <td>{renderSelfieCell(item.checkOutSelfiePath || item.checkOutSelfieUrl)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selfieModal && (
        <div className="director-modal-overlay" onClick={() => setSelfieModal(null)}>
          <div className="director-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="director-modal-close" onClick={() => setSelfieModal(null)}>
              &times;
            </button>
            <img src={selfieModal} alt="Selfie" className="director-selfie-full" />
          </div>
        </div>
      )}
    </>
  );
}

export default DirectorDashboard;
