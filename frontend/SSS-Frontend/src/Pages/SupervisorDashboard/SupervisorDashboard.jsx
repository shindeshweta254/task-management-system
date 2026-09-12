import Layout from "../../components/Layout/Layout";
import "./SupervisorDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../api/index";
import { FaUsers, FaCalendarCheck, FaHourglassHalf, FaCheckCircle, FaClipboardList, FaUserCheck } from "react-icons/fa";

function SupervisorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userName = user.name || "Supervisor";
  const department = user.department || "-";
  const employeeId = user.employeeId || "-";
  const siteCode = user.siteCode || "";

  const nameParts = userName.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "S";

  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayAttendance: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  const [myTasks, setMyTasks] = useState([]);
  const [birthdayEmployees, setBirthdayEmployees] = useState([]);

  const getUpcomingBirthdays = (employees) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (Array.isArray(employees) ? employees : [])
      .filter((emp) => emp?.dateOfBirth && String(emp?.status || "ACTIVE").toUpperCase() === "ACTIVE")
      .map((emp) => {
        const parts = String(emp.dateOfBirth).split("-");
        if (parts.length !== 3) return null;

        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        let nextBirthday = new Date(today.getFullYear(), month, day);
        nextBirthday.setHours(0, 0, 0, 0);

        if (nextBirthday < today) {
          nextBirthday = new Date(today.getFullYear() + 1, month, day);
          nextBirthday.setHours(0, 0, 0, 0);
        }

        const daysLeft = Math.round(
          (nextBirthday - today) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft < 0 || daysLeft > 7) return null;

        return { ...emp, daysLeft };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const getUserId = (userObj) => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?.employeeId;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    const loadStats = async () => {
      const headers = getAuthHeaders({ "Content-Type": "application/json" });

      const fetchNumber = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return 0;
          const text = await res.text();
          const val = Number(text);
          return Number.isFinite(val) ? val : 0;
        } catch {
          return 0;
        }
      };

      const fetchUsers = async () => {
        try {
          const url = siteCode
            ? `https://task-management-system-production-7694.up.railway.app/api/users/site/${encodeURIComponent(siteCode)}`
            : "https://task-management-system-production-7694.up.railway.app/api/users";
          const res = await fetch(url, { headers });
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      };

      try {
        const [users, pending, completed, attendance] = await Promise.all([
          fetchUsers(),
          fetchNumber("https://task-management-system-production-7694.up.railway.app/api/tasks/count/pending"),
          fetchNumber("https://task-management-system-production-7694.up.railway.app/api/tasks/count/completed"),
          fetchNumber("https://task-management-system-production-7694.up.railway.app/api/dashboard/todays-attendance"),
        ]);

        setBirthdayEmployees(getUpcomingBirthdays(users));

        setStats({
          totalEmployees: Array.isArray(users) ? users.length : 0,
          todayAttendance: typeof attendance === "number" ? attendance : 0,
          pendingTasks: pending || 0,
          completedTasks: completed || 0,
        });
      } catch {
        const attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || [];
        const today = new Date().toLocaleDateString("en-IN");
        const todayCount = attendanceData.filter((a) => a.date === today && a.punchIn).length;
        setStats((prev) => ({ ...prev, todayAttendance: todayCount }));
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        const id = getUserId(user);
        if (!id) return;
        const res = await fetch(`https://task-management-system-production-7694.up.railway.app/api/tasks/employee/${id}`, {
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
        });
        if (!res.ok) { setMyTasks([]); return; }
        const data = await res.json();
        setMyTasks(Array.isArray(data) ? data : []);
      } catch {
        setMyTasks([]);
      }
    };

    loadMyTasks();
  }, []);

  const myTasksFiltered = myTasks.filter((t) => {
    const taskDept = t?.assignedTo?.department || t?.assignedTo?.dept || null;
    if (!department || department === "-") return true;
    if (!taskDept) return true;
    return String(taskDept).toLowerCase() === String(department).toLowerCase();
  });

  return (
    <Layout title="Supervisor Dashboard">
      {/* Hero */}
      <section className="sv-hero">
        <div className="sv-hero-left">
          <div className="sv-avatar">{initials}</div>
          <div>
            <h2>Welcome, {userName}!</h2>
            <p>ID: {employeeId} &nbsp;|&nbsp; Dept: {department} &nbsp;|&nbsp; Site: {siteCode || "-"} &nbsp;|&nbsp; Role: SUPERVISOR</p>
          </div>
        </div>
        <img src="/logo.png" alt="logo" className="sv-hero-logo" />
      </section>

      {/* Birthday Notifications */}
      {birthdayEmployees.length > 0 && (
        <section className="sv-birthday-alert">
          <h3>🎂 Upcoming Birthdays</h3>

          {birthdayEmployees.map((emp) => (
            <div
              className="sv-birthday-person"
              key={emp.id || emp.employeeId}
            >
              <strong>
                {emp.daysLeft === 0
                  ? `🎉 Happy Birthday ${emp.name}!`
                  : `🎈 ${emp.name}`}
              </strong>

              <span>
                {emp.daysLeft === 0
                  ? "Today"
                  : emp.daysLeft === 1
                  ? "Tomorrow"
                  : `In ${emp.daysLeft} days`}
                {" • "} DOB: {emp.dateOfBirth}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Stats */}
      <section className="sv-stats">
        <div className="sv-stat-card blue">
          <FaUsers className="sv-icon" />
          <div>
            <h2>{stats.totalEmployees}</h2>
            <p>Total Employees</p>
            <span>Apni Site</span>
          </div>
        </div>

        <div className="sv-stat-card green">
          <FaUserCheck className="sv-icon" />
          <div>
            <h2>{stats.todayAttendance}</h2>
            <p>Today's Attendance</p>
            <span>Present today</span>
          </div>
        </div>

        <div className="sv-stat-card orange">
          <FaHourglassHalf className="sv-icon" />
          <div>
            <h2>{stats.pendingTasks}</h2>
            <p>Pending Tasks</p>
            <span>Tasks in progress</span>
          </div>
        </div>

        <div className="sv-stat-card purple">
          <FaCheckCircle className="sv-icon" />
          <div>
            <h2>{stats.completedTasks}</h2>
            <p>Completed Tasks</p>
            <span>Tasks done</span>
          </div>
        </div>
      </section>

      {/* My Tasks */}
      <section className="sv-quick" style={{ marginTop: 18 }}>
        <h3>My Tasks (Dept: {department})</h3>
        {myTasksFiltered.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          <div>
            {myTasksFiltered.slice(0, 5).map((t) => (
              <p key={t.id} style={{ margin: "8px 0" }}>
                {t.taskTitle} - <b>{t.status}</b>
                {t.dueDate ? ` (Due: ${t.dueDate})` : ""}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Quick Access */}
      <section className="sv-quick">
        <h3>Quick Access</h3>
        <div className="sv-quick-btns">
          <button onClick={() => navigate("/attendance")}><FaCalendarCheck /> Attendance</button>
          <button onClick={() => navigate("/task")}><FaClipboardList /> Tasks</button>
          <button onClick={() => navigate("/team")}><FaUsers /> Team</button>
          <button onClick={() => navigate("/checklist")}><FaCheckCircle /> Checklist</button>
        </div>
      </section>
      {/* SSS FMS Websites */}
      <section className="sss-websites-section">
        <div className="sss-websites-heading">
          <span className="sss-websites-kicker">SSS FMS DIGITAL</span>
          <h2>Our Websites</h2>
          <p>Quick access to our official website and service portal.</p>
        </div>

        <div className="sss-websites-grid">
          <a
            href="https://sssfmsindia.com/"
            target="_blank"
            rel="noreferrer"
            className="sss-website-card"
          >
            <div className="sss-website-icon">WEB</div>
            <div className="sss-website-content">
              <span className="sss-website-badge">OFFICIAL</span>
              <h3>SSS FMS India</h3>
              <p>Visit the official SSS FMS India company website.</p>
              <span className="sss-website-link">Visit Website</span>
            </div>
          </a>

          <a
            href="https://ramcodesolutions.com/SSS-FMS-INDIA-PVT-LTD"
            target="_blank"
            rel="noreferrer"
            className="sss-website-card"
          >
            <div className="sss-website-icon">APP</div>
            <div className="sss-website-content">
              <span className="sss-website-badge">SERVICES</span>
              <h3>SSS FMS Services</h3>
              <p>Explore SSS FMS services, solutions and company information.</p>
              <span className="sss-website-link">Explore Services</span>
            </div>
          </a>
        </div>
      </section>

    </Layout>
  );
}

export default SupervisorDashboard;
