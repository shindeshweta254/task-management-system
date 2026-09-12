import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import {
  fetchAllUsers,
  fetchMySiteTeam,
  uploadSiteTeamExcel,
  addEmployee,
  updateUserContact,
  updateEmployee,
  removeEmployee,
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

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    contactNo: "",
    dateOfBirth: "",
    dateOfJoining: "",
    department: "",
    designation: "",
    shift: "",
    siteCode: "",
    status: "ACTIVE",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Add employee form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    employeeId: "",
    email: "",
    contactNo: "",
    dateOfBirth: "",
    dateOfJoining: "",
    siteCode: "",
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

  const supervisorSiteOptions = useMemo(() => {
    return String(siteCode || "")
      .split(",")
      .map((site) => site.trim())
      .filter(Boolean);
  }, [siteCode]);



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
  }, [loadTeams]);  // ========== GROUPING FOR DIRECTOR VIEW ==========
  // Show only real sites.
  // Multi-site supervisors are attached to each permitted site.
  // ALL / blank site codes are not shown as separate site cards.
  const directorGroups = useMemo(() => {
    if (!isDirector) return [];

    const siteMap = new Map();

    users.forEach((u) => {
      const rawSiteCode = String(u?.siteCode || "").trim();
      const role = String(
        u?.roleName || u?.role?.roleName || ""
      ).toUpperCase();

      if (!rawSiteCode) {
        const officeCode = "OFFICE STAFF";

        if (!siteMap.has(officeCode)) {
          siteMap.set(officeCode, {
            siteCode: officeCode,
            employees: [],
            supervisors: [],
          });
        }

        const officeGroup = siteMap.get(officeCode);

        if (role === "SUPERVISOR" || role === "MANAGER") {
          const supervisorName =
            u.name || u.employeeId || "Not assigned";

          if (!officeGroup.supervisors.includes(supervisorName)) {
            officeGroup.supervisors.push(supervisorName);
          }
        } else {
          officeGroup.employees.push(u);
        }

        return;
      }

      const siteCodes = rawSiteCode
        .split(",")
        .map((site) => site.trim().toUpperCase())
        .filter((site) => site && site !== "ALL");

      siteCodes.forEach((siteCode) => {
        if (!siteMap.has(siteCode)) {
          siteMap.set(siteCode, {
            siteCode,
            employees: [],
            supervisors: [],
          });
        }

        const group = siteMap.get(siteCode);

        if (role === "SUPERVISOR" || role === "MANAGER") {
          const supervisorName =
            u.name || u.employeeId || "Not assigned";

          if (!group.supervisors.includes(supervisorName)) {
            group.supervisors.push(supervisorName);
          }
        } else {
          group.employees.push(u);
        }
      });
    });

    return Array.from(siteMap.values())
      .map((group) => ({
        siteCode: group.siteCode,
        supervisor:
          group.supervisors.join(", ") || "Not assigned",
        employeeCount: group.employees.length,
        employees: group.employees,
      }))
      .sort((a, b) =>
        a.siteCode.localeCompare(b.siteCode)
      );
  }, [users, isDirector]);

  // ========== UPCOMING BIRTHDAYS ==========
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return users
      .filter((employee) => employee?.dateOfBirth)
      .map((employee) => {
        const parts = String(employee.dateOfBirth).split("-");
        if (parts.length !== 3) return null;

        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);

        let nextBirthday = new Date(
          today.getFullYear(),
          month,
          day
        );
        nextBirthday.setHours(0, 0, 0, 0);

        if (nextBirthday < today) {
          nextBirthday = new Date(
            today.getFullYear() + 1,
            month,
            day
          );
          nextBirthday.setHours(0, 0, 0, 0);
        }

        const daysLeft = Math.round(
          (nextBirthday - today) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft < 0 || daysLeft > 7) return null;

        return {
          ...employee,
          daysLeft,
          nextBirthday,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [users]);

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
        dateOfBirth: newEmployee.dateOfBirth || null,
        dateOfJoining: newEmployee.dateOfJoining || null,
        department: newEmployee.department.trim(),
        designation: newEmployee.designation.trim(),
        shift: newEmployee.shift.trim(),
        siteCode: newEmployee.siteCode || siteCode,
        password: `${empId}@123`,
        status: "ACTIVE",
        role: { id: EMPLOYEE_ROLE_ID, roleName: "EMPLOYEE" },
      };

      await addEmployee(payload);

      setAddMsg("Employee added successfully");
      setNewEmployee({
        name: "",
        employeeId: "",
        email: "",
        contactNo: "",
        dateOfBirth: "",
        dateOfJoining: "",
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
      setUploadMsg(typeof result === "string" ? result : "Upload successful");
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

  const handleUpdateEmployee = (employee) => {
    setEditingEmployee(employee);

    setEditForm({
      name: employee?.name || "",
      email: employee?.email || "",
      contactNo: employee?.contactNo || "",
      dateOfBirth: employee?.dateOfBirth || "",
      dateOfJoining: employee?.dateOfJoining || "",
      department: employee?.department || "",
      designation: employee?.designation || "",
      shift: employee?.shift || "",
      siteCode: employee?.siteCode || "",
      status: employee?.status || "ACTIVE",
    });
  };

  const handleSaveEmployeeUpdate = async (e) => {
    e.preventDefault();

    if (!editingEmployee?.id || editSaving) return;

    setEditSaving(true);

    try {
      await updateEmployee(editingEmployee.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        contactNo: editForm.contactNo.trim(),
        dateOfBirth: editForm.dateOfBirth || null,
        dateOfJoining: editForm.dateOfJoining || null,
        department: editForm.department.trim(),
        designation: editForm.designation.trim(),
        shift: editForm.shift.trim(),
        siteCode: editForm.siteCode.trim(),
        status: editForm.status,
      });

      alert("Employee updated successfully.");

      setEditingEmployee(null);
      await loadTeams();

    } catch (err) {
      alert(readableError(err) || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveEmployee = async (employee) => {
    const ok = window.confirm(
      `Remove ${employee?.name || employee?.employeeId} from active team?`
    );

    if (!ok) return;

    try {
      await removeEmployee(employee.id);
      alert("Employee removed from active team.");
      await loadTeams();
    } catch (err) {
      alert(readableError(err) || "Remove failed");
    }
  };

  const handleDeleteEmployee = (employee) => {
    alert(
      `Permanent Delete for ${employee?.name || employee?.employeeId} abhi disabled hai. Attendance aur task history safe rakhi gayi hai.`
    );
  };
  return (
    <Layout title="Team">
      <div className="team-page">

  {editingEmployee && (
    <div className="team-edit-overlay">
      <form className="team-edit-modal" onSubmit={handleSaveEmployeeUpdate}>

        <div className="team-edit-head">
          <div>
            <h3>Edit Employee</h3>
            <p>{editingEmployee.employeeId || ""}</p>
          </div>

          <button
            type="button"
            className="team-edit-close"
            onClick={() => setEditingEmployee(null)}
          >
            X
          </button>
        </div>

        <div className="team-edit-grid">

          <label>
            Name
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
          </label>

          <label>
            Mobile Number
            <input
              value={editForm.contactNo}
              onChange={(e) =>
                setEditForm({ ...editForm, contactNo: e.target.value })
              }
            />
          </label>

          <label>
            Date of Birth
            <input
              type="date"
              value={editForm.dateOfBirth}
              onChange={(e) =>
                setEditForm({ ...editForm, dateOfBirth: e.target.value })
              }
            />
          </label>

          <label>
            Date of Joining
            <input
              type="date"
              value={editForm.dateOfJoining}
              onChange={(e) =>
                setEditForm({ ...editForm, dateOfJoining: e.target.value })
              }
            />
          </label>

          <label>
            Department
            <input
              value={editForm.department}
              onChange={(e) =>
                setEditForm({ ...editForm, department: e.target.value })
              }
            />
          </label>

          <label>
            Designation
            <input
              value={editForm.designation}
              onChange={(e) =>
                setEditForm({ ...editForm, designation: e.target.value })
              }
            />
          </label>

          <label>
            Shift
            <input
              value={editForm.shift}
              onChange={(e) =>
                setEditForm({ ...editForm, shift: e.target.value })
              }
            />
          </label>

          <label>
            Site Code
            <input
              value={editForm.siteCode}
              onChange={(e) =>
                setEditForm({ ...editForm, siteCode: e.target.value })
              }
            />
          </label>

          <label>
            Status
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="RESIGNED">RESIGNED</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>

        </div>

        <div className="team-edit-actions">
          <button type="submit" disabled={editSaving}>
            {editSaving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => setEditingEmployee(null)}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  )}
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

          {/* Birthday Notifications */}
          {upcomingBirthdays.length > 0 && (
            <div className="team-birthday-notifications">
              {upcomingBirthdays.map((employee) => (
                <div
                  className="team-birthday-card"
                  key={`birthday-${employee.id || employee.employeeId}`}
                >
                  <div className="team-birthday-icon">🎂</div>

                  <div>
                    <strong>
                      {employee.daysLeft === 0
                        ? `Happy Birthday ${employee.name || employee.employeeId}!`
                        : `Upcoming Birthday: ${employee.name || employee.employeeId}`}
                    </strong>

                    <p>
                      {employee.daysLeft === 0
                        ? "Birthday Today 🎉"
                        : employee.daysLeft === 1
                        ? "Birthday Tomorrow"
                        : `Birthday in ${employee.daysLeft} days`}
                      {" • "}
                      {employee.dateOfBirth}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                <label htmlFor="team-excel-upload" className="team-action-btn upload">Upload Team Excel</label>
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
                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={newEmployee.dateOfBirth}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dateOfBirth: e.target.value })}
                  />
                </label>

                <label>
                  Date of Joining
                  <input
                    type="date"
                    value={newEmployee.dateOfJoining}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dateOfJoining: e.target.value })}
                  />
                </label>

                <label>
                  Site
                  <select
                    required
                    value={newEmployee.siteCode || siteCode}
                    onChange={(e) => setNewEmployee({ ...newEmployee, siteCode: e.target.value })}
                  >
                    {supervisorSiteOptions.map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </label>

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
                        <th>Date of Birth</th>
                        <th>Date of Joining</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Shift</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisorEmployees.map((u, idx) => (
                        <tr key={u.id || u.employeeId || idx}>
                          <td>{idx + 1}</td>
                          <td>{u.employeeId || "-"}</td>
                          <td><strong>{u.name || "-"}</strong></td>
                          <td>{u.dateOfBirth || "-"}</td>
                          <td>{u.dateOfJoining || "-"}</td>
                          <td>{u.department || "-"}</td>
                          <td>{u.designation || "-"}</td>
                          <td>{u.shift || "-"}</td>
                          <td>{u.contactNo || "-"}</td>
                          <td>{u.status || "ACTIVE"}</td>

                          <td>
                            <div className="team-row-actions">
                              <button
                                type="button"
                                className="team-row-btn update"
                                onClick={() => handleUpdateEmployee(u)}
                              >
                                Update
                              </button>

                              <button
                                type="button"
                                className="team-row-btn remove"
                                onClick={() => handleRemoveEmployee(u)}
                              >
                                Remove
                              </button>

                              <button
                                type="button"
                                className="team-row-btn delete"
                                onClick={() => handleDeleteEmployee(u)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
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
                        <span className="team-card-icon">SITE</span>
                        <span className="team-view-label">View Team</span>
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
