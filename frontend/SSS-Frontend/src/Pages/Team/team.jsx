import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import {
  fetchAllUsers,
  fetchMySiteTeam,
  uploadSiteTeamExcel,
  addEmployee,
} from "../../api/userApi";
import {
  buildTeamGroups,
  getDisplayName,
  normalizeText,
  readableError,
} from "./teamUtils";
import "./Team.css";

const EMPLOYEE_ROLE_ID = 3; // EMPLOYEE role id in DB

function Team() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add employee form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employeeId: "",
    email: "",
    contactNo: "",
    department: "",
    designation: "",
    shift: "",
  });
  const [addMsg, setAddMsg] = useState("");

  // Excel upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  const roleName = String(user?.roleName || user?.role?.roleName || "").toUpperCase();
  const isDirector = roleName === "DIRECTOR" || roleName === "OWNER/ADMIN" || roleName === "OWNER";
  const isSupervisor = roleName === "SUPERVISOR";
  const siteCode = user?.siteCode || "";

  // ========== LOAD DATA ==========
  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let usersData;

      if (isSupervisor) {
        // Supervisor: only his site team
        usersData = await fetchMySiteTeam();
      } else {
        // Director: all users
        usersData = await fetchAllUsers();
      }

      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setUsers([]);
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }, [isSupervisor]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // ========== GROUPING FOR DIRECTOR VIEW ==========
  // Director sees all sites grouped by site_code with supervisor info
  const directorGroups = useMemo(() => {
    if (!isDirector) return [];

    // Find supervisors and group by site_code
    const siteMap = new Map();

    users.forEach((u) => {
      const sc = u?.siteCode || "Unknown";
      if (!siteMap.has(sc)) {
        siteMap.set(sc, { siteCode: sc, employees: [], supervisors: [] });
      }
      const group = siteMap.get(sc);
      group.employees.push(u);

      const role = String(u?.roleName || u?.role?.roleName || "").toUpperCase();
      if (role === "SUPERVISOR") {
        group.supervisors.push(u.name || u.employeeId || "Unknown");
      }
    });

    return Array.from(siteMap.entries())
      .map(([siteCode, group]) => ({
        siteCode,
        supervisor: group.supervisors.join(", ") || "Not assigned",
        employeeCount: group.employees.length,
        employees: group.employees,
      }))
      .sort((a, b) => a.siteCode.localeCompare(b.siteCode));
  }, [users, isDirector]);

  // ========== SUPERVISOR SITE EMPLOYEES ==========
  const supervisorEmployees = useMemo(() => {
    if (!isSupervisor) return [];
    return users;
  }, [users, isSupervisor]);

  // ========== ADD EMPLOYEE ==========
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddMsg("Saving...");

    try {
      const empId = newEmployee.employeeId.trim();

      const payload = {
        name: newEmployee.name.trim(),
        employeeId: empId,
        email: newEmployee.email.trim() || `${empId}@sss.com`,
        contactNo: newEmployee.contactNo.trim() || null,
        department: newEmployee.department.trim(),
        designation: newEmployee.designation.trim(),
        shift: newEmployee.shift.trim(),
        siteCode: siteCode,
        password: `${empId}@123`,
        status: "ACTIVE",
        role: { id: EMPLOYEE_ROLE_ID, roleName: "EMPLOYEE" },
      };

      await addEmployee(payload);

      setAddMsg("Employee added successfully ✅");
      setNewEmployee({
        name: "",
        employeeId: "",
        email: "",
        contactNo: "",
        department: "",
        designation: "",
        shift: "",
      });
      setShowAddForm(false);
      loadTeams();
    } catch (err) {
      setAddMsg(`Failed: ${err.message}`);
    }
  };

  // ========== UPLOAD EXCEL ==========
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMsg("Please select a file first.");
      return;
    }

    setUploadMsg("Uploading...");
    try {
      const result = await uploadSiteTeamExcel(uploadFile);
      setUploadMsg(typeof result === "string" ? result : "Upload successful ✅");
      setUploadFile(null);
      loadTeams();
    } catch (err) {
      setUploadMsg(`Upload failed: ${err.message}`);
    }
  };

  // ========== OPEN TEAM DETAILS ==========
  const openTeamDetails = (siteCode) => {
    navigate(`/team/${encodeURIComponent(siteCode)}`, {
      state: { siteCode, siteTeam: users },
    });
  };

  return (
    <Layout title="Team">
      <div className="team-page">
        <section className="page-card">
          <div className="team-page-header">
            <div>
              <h2>{isSupervisor ? "My Site Team" : "All Teams"}</h2>
              <p>
                {isSupervisor
                  ? `Site: ${siteCode} | Employees: ${supervisorEmployees.length}`
                  : `${directorGroups.length} sites | ${users.length} total employees`}
              </p>
            </div>

            <input
              type="search"
              className="team-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team or supervisor..."
            />
          </div>

          {/* Supervisor: Add Employee & Upload Excel buttons */}
          {isSupervisor && (
            <div className="team-actions-bar">
              <button
                className="team-action-btn primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                + Add Employee
              </button>

              <div className="team-upload-section">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="team-file-input"
                  id="team-excel-upload"
                />
                <label htmlFor="team-excel-upload" className="team-action-btn upload">
                  📂 Upload Team Excel
                </label>
                {uploadFile && (
                  <button className="team-action-btn go" onClick={handleUploadExcel}>
                    Upload Now
                  </button>
                )}
              </div>
            </div>
          )}

          {uploadMsg && <p className="team-message">{uploadMsg}</p>}

          {/* Add Employee Form */}
          {showAddForm && isSupervisor && (
            <form className="team-add-form" onSubmit={handleAddEmployee}>
              <h3>Add New Employee</h3>
              <div className="team-add-form-grid">
                <input
                  required
                  placeholder="Employee ID *"
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                />
                <input
                  required
                  placeholder="Full Name *"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                />
                <input
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                />
                <input
                  placeholder="Mobile Number"
                  value={newEmployee.contactNo}
                  onChange={(e) => setNewEmployee({ ...newEmployee, contactNo: e.target.value })}
                />
                <input
                  placeholder="Department"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                />
                <input
                  placeholder="Designation"
                  value={newEmployee.designation}
                  onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                />
                <input
                  placeholder="Shift (Morning/Evening/Night)"
                  value={newEmployee.shift}
                  onChange={(e) => setNewEmployee({ ...newEmployee, shift: e.target.value })}
                />
              </div>
              <div className="team-add-form-actions">
                <button type="submit" className="team-action-btn primary">Save Employee</button>
                <button type="button" className="team-action-btn cancel" onClick={() => { setShowAddForm(false); setAddMsg(""); }}>Cancel</button>
              </div>
              {addMsg && <p className="team-message">{addMsg}</p>}
              <p className="team-form-note">Site: {siteCode} (auto-assigned)</p>
            </form>
          )}

          {loading && <div className="team-state">Loading teams...</div>}
          {!loading && error && <div className="team-state team-error">{error}</div>}

          {/* SUPERVISOR VIEW: Employee table */}
          {!loading && !error && isSupervisor && (
            <>
              {supervisorEmployees.length === 0 ? (
                <div className="team-state">No employees in your site team yet. Add employees above.</div>
              ) : (
                <div className="team-details-table-wrap">
                  <table className="team-details-table">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Shift</th>
                        <th>Contact</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisorEmployees.map((u, idx) => (
                        <tr key={u.id || u.employeeId || idx}>
                          <td>{idx + 1}</td>
                          <td>{u.employeeId || "-"}</td>
                          <td><strong>{u.name || "-"}</strong></td>
                          <td>{u.department || "-"}</td>
                          <td>{u.designation || "-"}</td>
                          <td>{u.shift || "-"}</td>
                          <td>{u.contactNo || "-"}</td>
                          <td>{u.status || "ACTIVE"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* DIRECTOR VIEW: Site cards */}
          {!loading && !error && isDirector && (
            <>
              {directorGroups.length === 0 ? (
                <div className="team-state">No teams found.</div>
              ) : (
                <div className="team-card-grid">
                  {directorGroups.map((group) => (
                    <button
                      key={group.siteCode}
                      type="button"
                      className="team-card"
                      onClick={() => openTeamDetails(group.siteCode)}
                    >
                      <div className="team-card-top">
                        <span className="team-card-icon">🏗️</span>
                        <span className="team-view-label">View Team →</span>
                      </div>
                      <h3>{group.siteCode}</h3>
                      <div className="team-count-row">
                        <strong>{group.employeeCount}</strong>
                        <span>{group.employeeCount === 1 ? "Employee" : "Employees"}</span>
                      </div>
                      <div className="team-supervisor">
                        <span>Supervisor / Manager</span>
                        <strong>{group.supervisor}</strong>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Team;
