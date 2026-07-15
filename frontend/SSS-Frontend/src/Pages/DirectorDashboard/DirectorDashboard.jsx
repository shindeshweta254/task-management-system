import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DirectorDashboard.css";

const menuItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "employees", label: "Employees" },
  { key: "addEmployee", label: "Add Employee" },
  { key: "tasks", label: "Tasks" },
  { key: "attendance", label: "Attendance" },
  { key: "reports", label: "Reports" },
  { key: "projects", label: "Projects" },
  { key: "calendar", label: "Calendar" },
  { key: "checklist", label: "Checklist" },
  { key: "settings", label: "Settings" },
];

function DirectorDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalEmployees: 0, todayAttendance: 0, pendingTasks: 0, completedTasks: 0, totalTasks: 0, todayDeadlines: 0 });
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee", department: "", phone: "" });
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/login"); return; }
    setUser(JSON.parse(stored));
    fetchStats();
    fetchEmployees();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/director/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/all");
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setFormMsg("Employee added successfully ✅");
        setForm({ name: "", email: "", password: "", role: "employee", department: "", phone: "" });
        fetchEmployees();
      } else {
        setFormMsg("Failed to add employee ❌");
      }
    } catch { setFormMsg("Server not connected ❌"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statCards = [
    { label: "Total Employees", value: stats.totalEmployees, color: "#4f46e5" },
    { label: "Today's Attendance", value: stats.todayAttendance, color: "#059669" },
    { label: "Pending Tasks", value: stats.pendingTasks, color: "#d97706" },
    { label: "Completed Tasks", value: stats.completedTasks, color: "#2563eb" },
    { label: "Total Tasks", value: stats.totalTasks, color: "#7c3aed" },
    { label: "Today's Deadlines", value: stats.todayDeadlines, color: "#dc2626" },
  ];

  return (
    <div className="dir-dashboard">

      {/* Sidebar */}
      <div className="dir-sidebar">
        <div className="dir-logo">
          <img src="/logo.png" alt="Logo" />
          <span>SSS FMS</span>
        </div>

        <ul className="dir-menu">
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={active === item.key ? "active" : ""}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </li>
          ))}
          <li className="dir-logout" onClick={handleLogout}>Logout</li>
        </ul>

        <div className="dir-user-box">
          <div className="dir-avatar">{user?.name?.charAt(0).toUpperCase() || "D"}</div>
          <div>
            <div className="dir-user-name">{user?.name || "Director"}</div>
            <div className="dir-user-role">DIRECTOR</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dir-main">

        {/* Navbar */}
        <div className="dir-navbar">
          <h2>{menuItems.find((m) => m.key === active)?.label || "Dashboard"}</h2>
          <input type="text" placeholder="Search..." className="dir-search" />
        </div>

        {/* DASHBOARD */}
        {active === "dashboard" && (
          <>
            <div className="dir-welcome">
              <h1>Welcome, {user?.name || "Director"} 👋</h1>
              <p>Here's your overview for today.</p>
            </div>
            <div className="dir-cards">
              {statCards.map((s) => (
                <div className="dir-card" key={s.label}>
                  <h2 style={{ color: s.color }}>{s.value}</h2>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* EMPLOYEES */}
        {active === "employees" && (
          <div className="dir-section">
            <h3>All Employees ({employees.length})</h3>
            <table className="dir-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Phone</th></tr>
              </thead>
              <tbody>
                {employees.length === 0
                  ? <tr><td colSpan="6" style={{ textAlign: "center" }}>No employees found</td></tr>
                  : employees.map((emp, i) => (
                    <tr key={emp.id || i}>
                      <td>{i + 1}</td><td>{emp.name}</td><td>{emp.email}</td>
                      <td><span className="dir-badge">{emp.role}</span></td>
                      <td>{emp.department || "-"}</td><td>{emp.phone || "-"}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* ADD EMPLOYEE */}
        {active === "addEmployee" && (
          <div className="dir-section dir-form-box">
            <h3>Add New Employee</h3>
            <form onSubmit={handleAddEmployee} className="dir-form">
              <div className="dir-form-row">
                <div className="dir-form-group"><label>Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter name" required /></div>
                <div className="dir-form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email" required /></div>
              </div>
              <div className="dir-form-row">
                <div className="dir-form-group"><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" required /></div>
                <div className="dir-form-group"><label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="director">Director</option>
                  </select>
                </div>
              </div>
              <div className="dir-form-row">
                <div className="dir-form-group"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Enter department" /></div>
                <div className="dir-form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" /></div>
              </div>
              <button type="submit" className="dir-submit-btn">Add Employee</button>
              {formMsg && <p className="dir-form-msg">{formMsg}</p>}
            </form>
          </div>
        )}

        {/* OTHER SECTIONS */}
        {["tasks", "attendance", "reports", "projects", "calendar", "checklist", "settings"].includes(active) && (
          <div className="dir-welcome">
            <h1>{menuItems.find((m) => m.key === active)?.label}</h1>
            <p>This module is coming soon.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default DirectorDashboard;
