import Layout from "../../components/Layout/Layout";
import "./DirectorDashboard.css";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaUsers, FaCalendarCheck, FaTasks,
  FaCheckCircle, FaHourglassHalf, FaFlag,
} from "react-icons/fa";

function DirectorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get("tab") || "dashboard";

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userName = user.name || "Director";
  const department = user.department || "-";
  const employeeId = user.employeeId || "-";
  const nameParts = userName.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "D";

  const [stats, setStats] = useState({ totalEmployees: 0, todayAttendance: 0, pendingTasks: 0, completedTasks: 0, totalTasks: 0, deadlines: 0 });
  const [myTasks, setMyTasks] = useState([]);

  const getUserId = (userObj) => {
    const id = userObj?.id ?? userObj?.userId ?? userObj?.employeeId;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };
  const [employees, setEmployees] = useState([]);
  const [newEmp, setNewEmp] = useState({ name: "", employeeId: "", email: "", department: "", role: "EMPLOYEE" });
  const [addMsg, setAddMsg] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelMsg, setExcelMsg] = useState("");
  const [projFile, setProjFile] = useState(null);
  const [projMsg, setProjMsg] = useState("");

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const loadMyTasks = async () => {
      try {
        const id = getUserId(user);
        if (!id) return;
        const res = await fetch(`http://localhost:8080/api/tasks/employee/${id}`);
        const data = await res.json();
        setMyTasks(Array.isArray(data) ? data : []);
      } catch {
        setMyTasks([]);
      }
    };

    loadMyTasks();
  }, []);


  const loadAll = async () => {
    try {
      const [users, total, pending, completed, deadlines] = await Promise.all([
        fetch("http://localhost:8080/api/users").then((r) => r.json()),
        fetch("http://localhost:8080/api/tasks/count/total").then((r) => r.json()),
        fetch("http://localhost:8080/api/tasks/count/pending").then((r) => r.json()),
        fetch("http://localhost:8080/api/tasks/count/completed").then((r) => r.json()),
        fetch("http://localhost:8080/api/tasks/deadline-today").then((r) => r.json()),
      ]);
      setEmployees(Array.isArray(users) ? users : []);
      const attData = JSON.parse(localStorage.getItem("attendanceData")) || [];
      const today = new Date().toLocaleDateString("en-IN");
      const todayAtt = attData.filter((a) => a.date === today && a.punchIn).length;
      setStats({ totalEmployees: Array.isArray(users) ? users.length : 0, todayAttendance: todayAtt, pendingTasks: pending || 0, completedTasks: completed || 0, totalTasks: total || 0, deadlines: deadlines || 0 });
    } catch {
      const attData = JSON.parse(localStorage.getItem("attendanceData")) || [];
      const today = new Date().toLocaleDateString("en-IN");
      const todayAtt = attData.filter((a) => a.date === today && a.punchIn).length;
      setStats((p) => ({ ...p, todayAttendance: todayAtt }));
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEmp, role: { roleName: newEmp.role }, status: "ACTIVE", password: newEmp.employeeId + "@123" }),
      });
      if (!res.ok) throw new Error("Failed");
      setAddMsg("Employee added successfully ✅");
      setNewEmp({ name: "", employeeId: "", email: "", department: "", role: "EMPLOYEE" });
      loadAll();
    } catch { setAddMsg("Error adding employee ❌"); }
  };

  const handleProjectExcelUpload = async (e) => {
    e.preventDefault();
    if (!projFile) { setProjMsg("⚠️ Pehle file select karo"); return; }
    setProjMsg("Uploading... ⏳");
    const formData = new FormData();
    formData.append("file", projFile);
    try {
      const res = await fetch("http://localhost:8080/api/projects/import", { method: "POST", body: formData });
      const text = await res.text();
      setProjMsg(res.ok ? "✅ " + text : "❌ " + text);
    } catch (err) {
      setProjMsg("❌ Upload failed: " + err.message);
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) { setExcelMsg("⚠️ Pehle file select karo"); return; }
    setExcelMsg("Uploading... ⏳");
    const formData = new FormData();
    formData.append("file", excelFile);
    try {
      const res = await fetch("http://localhost:8080/api/users/import-staff", { method: "POST", body: formData });
      const text = await res.text();
      if (res.ok) {
        setExcelMsg("✅ " + text);
        loadAll();
      } else {
        setExcelMsg("❌ Error: " + text);
      }
    } catch (err) {
      setExcelMsg("❌ Upload failed: " + err.message);
    }
  };

  return (
    <Layout title="Director Dashboard">
      <div className="dir-content">

        {/* DASHBOARD */}
        {activeSection === "dashboard" && (
          <>
            <section className="dir-hero">
              <div className="dir-hero-left">
                <div className="dir-avatar">{initials}</div>
                <div>
                  <h2>Welcome, {userName}! 👋</h2>
                  <p>ID: {employeeId} &nbsp;|&nbsp; Dept: {department} &nbsp;|&nbsp; Role: DIRECTOR</p>
                </div>
              </div>
              <img src="/logo.png" alt="logo" className="dir-hero-logo" />
            </section>

            <section className="dir-stats">
              <div className="dir-stat blue"><FaUsers /><div><h2>{stats.totalEmployees}</h2><p>Total Employees</p></div></div>
              <div className="dir-stat green"><FaCalendarCheck /><div><h2>{stats.todayAttendance}</h2><p>Today's Attendance</p></div></div>
              <div className="dir-stat orange"><FaHourglassHalf /><div><h2>{stats.pendingTasks}</h2><p>Pending Tasks</p></div></div>
              <div className="dir-stat purple"><FaCheckCircle /><div><h2>{stats.completedTasks}</h2><p>Completed Tasks</p></div></div>
              <div className="dir-stat red"><FaFlag /><div><h2>{stats.deadlines}</h2><p>Today's Deadlines</p></div></div>
              <div className="dir-stat teal"><FaTasks /><div><h2>{stats.totalTasks}</h2><p>Total Tasks</p></div></div>
            </section>

            <section className="dir-card" style={{ marginTop: 18 }}>
              <h2>My Tasks (Dept: {department})</h2>
              {myTasksFiltered.length === 0 ? (
                <p>No tasks assigned yet.</p>
              ) : (
                <div>
                  {myTasksFiltered.slice(0, 5).map((t, idx) => (
                    <p key={t.id ?? idx}>
                      ✅/⏳ {t.taskTitle} - <b>{t.status}</b>
                      {t.dueDate ? ` (Due: ${t.dueDate})` : ""}
                    </p>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* EMPLOYEES */}
        {activeSection === "employees" && (
          <div className="dir-card">
            <h2>👥 All Employees ({employees.length})</h2>
            <div className="dir-table-wrap">
              <table className="dir-table">
                <thead>
                  <tr><th>Name</th><th>Employee ID</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {employees.length === 0
                    ? <tr><td colSpan="6" className="dir-empty">No employees found</td></tr>
                    : employees.map((emp, i) => (
                      <tr key={i}>
                        <td>{emp.name}</td><td>{emp.employeeId}</td><td>{emp.email}</td>
                        <td>{emp.department || "-"}</td>
                        <td>{emp.role?.roleName || "-"}</td>
                        <td><span className={`dir-badge ${emp.status === "ACTIVE" ? "active" : "resigned"}`}>{emp.status}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD EMPLOYEE */}
        {activeSection === "add-employee" && (
          <div className="dir-card">
            <h2>➕ Add Employee</h2>
            <form className="dir-form" onSubmit={handleAddEmployee}>
              <div className="dir-form-grid">
                <div className="dir-field"><label>Full Name</label><input required placeholder="Enter full name" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} /></div>
                <div className="dir-field"><label>Employee ID</label><input required placeholder="e.g. SSS001" value={newEmp.employeeId} onChange={(e) => setNewEmp({ ...newEmp, employeeId: e.target.value })} /></div>
                <div className="dir-field"><label>Email</label><input required type="email" placeholder="Enter email" value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} /></div>
                <div className="dir-field"><label>Department</label><input placeholder="Enter department" value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} /></div>
                <div className="dir-field"><label>Role</label>
                  <select value={newEmp.role} onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="dir-submit-btn">➕ Add Employee</button>
              {addMsg && <p className="dir-msg">{addMsg}</p>}
            </form>
          </div>
        )}

        {/* UPLOAD EXCEL */}
        {activeSection === "upload-excel" && (
          <div className="dir-card">
            <h2>📊 Upload Staff Excel</h2>
            <p className="dir-hint">Format: Name | Emp ID | Department | Mobile | DOJ | Designation | Gender | Email | DOB</p>
            <form className="dir-form" onSubmit={handleExcelUpload}>
              <div className="dir-field">
                <label>Select Staff Excel File (.xlsx)</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files[0])} />
              </div>
              <button type="submit" className="dir-submit-btn">📤 Upload Staff Excel</button>
              {excelMsg && <p className="dir-msg">{excelMsg}</p>}
            </form>

            <hr style={{margin: "24px 0", border: "none", borderTop: "1px solid #e2e8f0"}} />

            <h2>🏗️ Upload Projects Excel</h2>
            <p className="dir-hint">Format: Row 2 = SITE : Name, Row 3 = Header, Row 4+ = Employee data</p>
            <form className="dir-form" onSubmit={handleProjectExcelUpload}>
              <div className="dir-field">
                <label>Select Projects Excel File (.xlsx)</label>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setProjFile(e.target.files[0])} />
              </div>
              <button type="submit" className="dir-submit-btn">📤 Upload Projects Excel</button>
              {projMsg && <p className="dir-msg">{projMsg}</p>}
            </form>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default DirectorDashboard;
