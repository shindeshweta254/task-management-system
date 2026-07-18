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

  const [projectExcelFile, setProjectExcelFile] = useState(null);
  const [projectExcelMessage, setProjectExcelMessage] = useState("");

  /**
   * Safely read JSON/text response.
   * Raw Spring Boot stack trace UI par show nahi hoga.
   */
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
          /*
           * Backend ka full HTML/stack trace user ko mat dikhana.
           * Short text ho to hi use karenge.
           */
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

  /**
   * Individual API failure ki wajah se poora dashboard fail nahi hoga.
   */
  const safeFetch = async (url, fallbackValue) => {
    try {
      const response = await fetch(url);
      return await readResponse(response, fallbackValue);
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      return fallbackValue;
    }
  };

  /**
   * Backend me GET /api/tasks 405 deta hai.
   * Isliye pehle /api/tasks/all use hoga.
   *
   * Agar kisi backend version me /all missing ho,
   * to employee task endpoint ko fake fallback nahi karenge.
   */
  const fetchAllTasks = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tasks/all`
      );

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

    // Ensure the dashboard home keeps the vertical sidebar behavior.
    // Removing the horizontal action row: default to home tab.
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

        safeFetch(
          `${API_BASE_URL}/api/tasks/count/total`,
          0
        ),

        safeFetch(
          `${API_BASE_URL}/api/tasks/count/pending`,
          0
        ),

        safeFetch(
          `${API_BASE_URL}/api/tasks/count/completed`,
          0
        ),

        safeFetch(
          `${API_BASE_URL}/api/tasks/deadline-today`,
          0
        ),
      ]);

      const validEmployees = Array.isArray(usersData)
        ? usersData
        : [];

      const validTasks = Array.isArray(tasksData)
        ? tasksData
        : [];

      setEmployees(validEmployees);
      setTasks(validTasks);

      setStats({
        totalEmployees: validEmployees.length,

        todayAttendance: calculateTodayAttendance(),

        pendingTasks:
          Number(pendingTasksCount) ||
          validTasks.filter(
            (task) =>
              String(task?.status).toUpperCase() === "PENDING"
          ).length,

        completedTasks:
          Number(completedTasksCount) ||
          validTasks.filter(
            (task) =>
              String(task?.status).toUpperCase() === "COMPLETED"
          ).length,

        totalTasks:
          Number(totalTasksCount) || validTasks.length,

        deadlines: Number(deadlineTasksCount) || 0,
      });
    } catch (error) {
      console.error("Director dashboard loading error:", error);

      setPageError(
        "Dashboard data load nahi hua. Backend API check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const openSection = (sectionName) => {
    setSearchParams({ tab: sectionName });
  };

  const handleAddEmployee = async (event) => {
    event.preventDefault();
    setEmployeeMessage("Saving employee...");

    try {
      const employeeIdValue =
        newEmployee.employeeId.trim();

      const response = await fetch(
        `${API_BASE_URL}/api/users`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: newEmployee.name.trim(),

            employeeId: employeeIdValue,

            email: newEmployee.email.trim(),

            contactNo:
              newEmployee.contactNo.trim() || null,

            department:
              newEmployee.department.trim(),

            password: `${employeeIdValue}@123`,

            status: "ACTIVE",

            role: {
              roleName: newEmployee.role,
            },
          }),
        }
      );

      const result = await readResponse(
        response,
        "Employee added successfully"
      );

      console.log("Created employee:", result);

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

      setEmployeeMessage(
        error?.message || "Employee add nahi hua ❌"
      );
    }
  };

  const handleStaffExcelUpload = async (event) => {
    event.preventDefault();

    if (!staffExcelFile) {
      setStaffExcelMessage(
        "Please select a staff Excel file."
      );
      return;
    }

    setStaffExcelMessage("Uploading staff Excel...");

    const formData = new FormData();
    formData.append("file", staffExcelFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/import-staff`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await readResponse(
        response,
        "Excel import successful"
      );

      setStaffExcelMessage(`✅ ${String(result)}`);
      setStaffExcelFile(null);

      await loadDashboardData();
    } catch (error) {
      console.error("Staff Excel upload error:", error);

      setStaffExcelMessage(
        `❌ ${error?.message || "Upload failed"}`
      );
    }
  };

  const handleProjectExcelUpload = async (event) => {
    event.preventDefault();

    if (!projectExcelFile) {
      setProjectExcelMessage(
        "Please select a projects Excel file."
      );
      return;
    }

    setProjectExcelMessage("Uploading projects Excel...");

    const formData = new FormData();
    formData.append("file", projectExcelFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/import`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await readResponse(
        response,
        "Project Excel import successful"
      );

      setProjectExcelMessage(`✅ ${String(result)}`);
      setProjectExcelFile(null);
    } catch (error) {
      console.error("Project Excel upload error:", error);

      setProjectExcelMessage(
        `❌ ${error?.message || "Upload failed"}`
      );
    }
  };

  // Prevent runtime crash if the horizontal director tab array is removed.
  // Keep the dashboard home working (vertical sidebar is handled by Layout).
  const directorTabs = [];

  return (
    <Layout title="Director Dashboard">
      <main className="director-dashboard-page">
        {/* Ye sidebar nahi hai; sirf horizontal tabs hain */}
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
          <div className="director-error-message">
            {pageError}
          </div>
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
                <div className="director-avatar">
                  {initials}
                </div>

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
              <StatsCard
                type="employees"
                icon={<FaUsers />}
                value={stats.totalEmployees}
                label="Total Employees"
              />

              <StatsCard
                type="attendance"
                icon={<FaCalendarCheck />}
                value={stats.todayAttendance}
                label="Today's Attendance"
              />

              <StatsCard
                type="pending"
                icon={<FaHourglassHalf />}
                value={stats.pendingTasks}
                label="Pending Tasks"
              />

              <StatsCard
                type="completed"
                icon={<FaCheckCircle />}
                value={stats.completedTasks}
                label="Completed Tasks"
              />

              <StatsCard
                type="deadlines"
                icon={<FaFlag />}
                value={stats.deadlines}
                label="Today's Deadlines"
              />

              <StatsCard
                type="tasks"
                icon={<FaTasks />}
                value={stats.totalTasks}
                label="Total Tasks"
              />
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

              <button
                type="button"
                onClick={() => navigate("/add-task")}
              >
                Add Task
              </button>
            </div>

            <TaskTable tasks={tasks} />
          </section>
        )}

        {!loading &&
          activeSection === "add-employee" && (
            <section className="director-card">
              <div className="director-card-heading">
                <div>
                  <h2>Add Employee</h2>
                  <p>Create a new employee account</p>
                </div>
              </div>

              <form
                className="director-form"
                onSubmit={handleAddEmployee}
              >
                <label>
                  Full Name
                  <input
                    required
                    type="text"
                    placeholder="Enter full name"
                    value={newEmployee.name}
                    onChange={(event) =>
                      setNewEmployee({
                        ...newEmployee,
                        name: event.target.value,
                      })
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
                      setNewEmployee({
                        ...newEmployee,
                        employeeId: event.target.value,
                      })
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
                      setNewEmployee({
                        ...newEmployee,
                        email: event.target.value,
                      })
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
                      setNewEmployee({
                        ...newEmployee,
                        contactNo: event.target.value,
                      })
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
                      setNewEmployee({
                        ...newEmployee,
                        department: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Role
                  <select
                    value={newEmployee.role}
                    onChange={(event) =>
                      setNewEmployee({
                        ...newEmployee,
                        role: event.target.value,
                      })
                    }
                  >
                    <option value="EMPLOYEE">
                      Employee
                    </option>

                    <option value="SUPERVISOR">
                      Supervisor
                    </option>

                    <option value="MANAGER">
                      Manager
                    </option>

                    <option value="DIRECTOR">
                      Director
                    </option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="director-primary-button"
                >
                  Add Employee
                </button>
              </form>

              {employeeMessage && (
                <p className="director-message">
                  {employeeMessage}
                </p>
              )}
            </section>
          )}

        {!loading &&
          activeSection === "upload-excel" && (
            <section className="director-upload-grid">
              <article className="director-card no-margin">
                <h2>Upload Staff Excel</h2>

                <p className="director-help-text">
                  Name | Emp ID | Department | Mobile |
                  DOJ | Designation | Gender | Email |
                  DOB
                </p>

                <form
                  className="director-upload-form"
                  onSubmit={handleStaffExcelUpload}
                >
                  <input
                    key={staffExcelMessage}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      setStaffExcelFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />

                  <button type="submit">
                    Upload Staff Excel
                  </button>
                </form>

                {staffExcelMessage && (
                  <p className="director-message">
                    {staffExcelMessage}
                  </p>
                )}
              </article>

              <article className="director-card no-margin">
                <h2>Upload Projects Excel</h2>

                <p className="director-help-text">
                  Upload approved site/project Excel
                  format.
                </p>

                <form
                  className="director-upload-form"
                  onSubmit={handleProjectExcelUpload}
                >
                  <input
                    key={projectExcelMessage}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) =>
                      setProjectExcelFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />

                  <button type="submit">
                    Upload Projects Excel
                  </button>
                </form>

                {projectExcelMessage && (
                  <p className="director-message">
                    {projectExcelMessage}
                  </p>
                )}
              </article>
            </section>
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
            <th>Employee ID</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td
                colSpan="7"
                className="director-empty-cell"
              >
                No employees found.
              </td>
            </tr>
          ) : (
            employees.map((employee, index) => (
              <tr
                key={
                  employee?.id ||
                  employee?.employeeId ||
                  index
                }
              >
                <td>{employee?.name || "-"}</td>

                <td>{employee?.employeeId || "-"}</td>

                <td>{employee?.email || "-"}</td>

                <td>{employee?.contactNo || "-"}</td>

                <td>{employee?.department || "-"}</td>

                <td>
                  {employee?.role?.roleName || "-"}
                </td>

                <td>
                  <span
                    className={`director-status ${
                      employee?.status === "ACTIVE"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {employee?.status || "-"}
                  </span>
                </td>
              </tr>
            ))
          )}
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
            <th>Task</th>
            <th>Assigned Employee</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Progress</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="director-empty-cell"
              >
                No tasks found.
              </td>
            </tr>
          ) : (
            tasks.map((task, index) => (
              <tr key={task?.id || index}>
                <td>
                  {task?.taskTitle ||
                    task?.title ||
                    "-"}
                </td>

                <td>
                  {task?.assignedTo?.name || "-"}
                </td>

                <td>{task?.priority || "-"}</td>

                <td>
                  <span className="director-task-status">
                    {task?.status || "PENDING"}
                  </span>
                </td>

                <td>{task?.dueDate || "-"}</td>

                <td>
                  {task?.progressPercentage ??
                    task?.progress ??
                    0}
                  %
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DirectorDashboard;