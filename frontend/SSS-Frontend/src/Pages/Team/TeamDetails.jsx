import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./TeamDetails.css";

import {
  fetchAllUsers,
  fetchUsersBySiteCode,
  addEmployee,
  updateUserContact,
  uploadSiteTeamExcel,
} from "../../api/userApi";

function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);

  // Add employee form
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

  // Excel upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  // Edit contact
  const [editContactId, setEditContactId] = useState(null);
  const [editContactValue, setEditContactValue] = useState("");

  const roleName = String(user?.roleName || user?.role?.roleName || "").toUpperCase();
  const isSupervisor = roleName === "SUPERVISOR";
  const isDirector = roleName === "DIRECTOR" || roleName === "OWNER/ADMIN" || roleName === "OWNER";
  const siteCode = decodeURIComponent(teamId || "");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (isSupervisor) {
        // Supervisor can only see his own site team
        const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
        const headers = loggedInUser?.id ? { "X-User-Id": String(loggedInUser.id) } : {};
        const res = await fetch("http://localhost:8080/api/users/my-site-team", { headers });
        data = await res.json();
      } else {
        // Director: fetch all users and filter by site code
        data = await fetchAllUsers();
      }
      const allUsers = Array.isArray(data) ? data : [];
      // Filter by site_code
      const filtered = allUsers.filter((u) => {
        const usc = u?.siteCode || "";
        return usc.toUpperCase() === siteCode.toUpperCase();
      });
      setEmployees(filtered);
    } catch (e) {
      setError(e?.message || "Failed to load team details");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [siteCode, isSupervisor]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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
        role: { id: 3, roleName: "EMPLOYEE" },
      };
      await addEmployee(payload);
      setAddMsg("Employee added successfully ✅");
      setNewEmployee({ name: "", employeeId: "", email: "", contactNo: "", department: "", designation: "", shift: "" });
      setShowAddForm(false);
      loadEmployees();
    } catch (err) {
      setAddMsg(`Failed: ${err.message}`);
    }
  };

  // ========== UPLOAD EXCEL ==========
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMsg("Please select a file.");
      return;
    }
    setUploadMsg("Uploading...");
    try {
      const result = await uploadSiteTeamExcel(uploadFile);
      setUploadMsg(typeof result === "string" ? result : "Upload successful ✅");
      setUploadFile(null);
      loadEmployees();
    } catch (err) {
      setUploadMsg(`Upload failed: ${err.message}`);
    }
  };

  // ========== EDIT CONTACT ==========
  const handleSaveContact = async (userId) => {
    try {
      await updateUserContact(userId, editContactValue);
      setEditContactId(null);
      loadEmployees();
    } catch (err) {
      alert("Failed to update contact: " + err.message);
    }
  };

  return (
    <Layout title="Team Details">
      <div className="team-details-page">
        <div className="team-details-card">
          <div className="team-details-header">
            <button type="button" className="team-details-back" onClick={() => navigate("/team")}>
              ← Back to Teams
            </button>
            <div className="team-details-title">
              <h2>{siteCode}</h2>
              <div className="team-details-count">Total employees: {employees.length}</div>
            </div>
          </div>

          {/* Add Employee & Upload (Supervisor only) */}
          {isSupervisor && (
            <>
              <div className="team-actions-bar">
                <button className="team-action-btn primary" onClick={() => setShowAddForm(!showAddForm)}>
                  + Add Employee
                </button>
                <div className="team-upload-section">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="team-file-input"
                    id="td-excel-upload"
                  />
                  <label htmlFor="td-excel-upload" className="team-action-btn upload">
                    📂 Upload Team Excel
                  </label>
                  {uploadFile && (
                    <button className="team-action-btn go" onClick={handleUploadExcel}>
                      Upload Now
                    </button>
                  )}
                </div>
              </div>
              {uploadMsg && <p className="team-message">{uploadMsg}</p>}

              {showAddForm && (
                <form className="team-add-form" onSubmit={handleAddEmployee}>
                  <h3>Add New Employee</h3>
                  <div className="team-add-form-grid">
                    <input required placeholder="Employee ID *" value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })} />
                    <input required placeholder="Full Name *" value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                    <input placeholder="Email" value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                    <input placeholder="Mobile Number" value={newEmployee.contactNo}
                      onChange={(e) => setNewEmployee({ ...newEmployee, contactNo: e.target.value })} />
                    <input placeholder="Department" value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} />
                    <input placeholder="Designation" value={newEmployee.designation}
                      onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })} />
                    <input placeholder="Shift (Morning/Evening/Night)" value={newEmployee.shift}
                      onChange={(e) => setNewEmployee({ ...newEmployee, shift: e.target.value })} />
                  </div>
                  <div className="team-add-form-actions">
                    <button type="submit" className="team-action-btn primary">Save Employee</button>
                    <button type="button" className="team-action-btn cancel" onClick={() => { setShowAddForm(false); setAddMsg(""); }}>Cancel</button>
                  </div>
                  {addMsg && <p className="team-message">{addMsg}</p>}
                  <p className="team-form-note">Site: {siteCode} (auto-assigned)</p>
                </form>
              )}
            </>
          )}

          {loading ? (
            <p className="team-details-loading">Loading...</p>
          ) : employees.length === 0 ? (
            <p className="team-details-empty">No employees found for this site.</p>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((u, idx) => (
                    <tr key={u.id || u.employeeId || idx}>
                      <td>{idx + 1}</td>
                      <td>{u.employeeId || "-"}</td>
                      <td><strong>{u.name || "-"}</strong></td>
                      <td>{u.department || "-"}</td>
                      <td>{u.designation || "-"}</td>
                      <td>{u.shift || "-"}</td>
                      <td>
                        {editContactId === u.id ? (
                          <div className="edit-contact-row">
                            <input
                              type="text"
                              value={editContactValue}
                              onChange={(e) => setEditContactValue(e.target.value)}
                              className="edit-contact-input"
                            />
                            <button className="save-contact-btn" onClick={() => handleSaveContact(u.id)}>Save</button>
                            <button className="cancel-contact-btn" onClick={() => setEditContactId(null)}>X</button>
                          </div>
                        ) : (
                          <span>{u.contactNo || "-"}</span>
                        )}
                      </td>
                      <td>{u.status || "ACTIVE"}</td>
                      <td>
                        {isSupervisor && (
                          <button
                            className="team-details-action"
                            onClick={() => {
                              setEditContactId(u.id);
                              setEditContactValue(u.contactNo || "");
                            }}
                          >
                            Edit Contact
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && !loading && <p className="team-details-error">{error}</p>}
        </div>
      </div>
    </Layout>
  );
}

export default TeamDetails;
