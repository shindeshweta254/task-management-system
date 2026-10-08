import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import {
  createSite,
  getAllSites,
  updateSiteStatus,
} from "../../api/siteApi";
import { fetchAllUsers } from "../../api/directorDashboardApi";
import {
  updateEmployee,
  addSupervisor,
  deactivateSupervisor,
} from "../../api/userApi";
import "./SiteManagement.css";

function SiteManagement() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const roleName = String(
    user?.roleName || user?.role?.roleName || ""
  ).trim().toUpperCase();

  const employeeId = String(user?.employeeId || "")
    .trim()
    .toUpperCase();

  const hasAccess = roleName === "DIRECTOR" || employeeId === "SP001";

  const [sites, setSites] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [siteCode, setSiteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedSupervisorSites, setSelectedSupervisorSites] = useState([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Supervisor Management
  const [supervisorDropdownOpen, setSupervisorDropdownOpen] = useState(false);
  const [showAddSupervisor, setShowAddSupervisor] = useState(false);
  const [newSupervisorEmployeeId, setNewSupervisorEmployeeId] = useState("");
  const [newSupervisorName, setNewSupervisorName] = useState("");
  const [newSupervisorEmail, setNewSupervisorEmail] = useState("");
  const [newSupervisorContactNo, setNewSupervisorContactNo] = useState("");
  const [addingSupervisor, setAddingSupervisor] = useState(false);
  const [deactivatingSupervisorId, setDeactivatingSupervisorId] = useState("");

  const loadSites = useCallback(async () => {
    if (!hasAccess) return;

    try {
      setLoading(true);
      setError("");

      const data = await getAllSites();
      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[SiteManagement] Failed to load sites:", err);
      setError(err?.message || "Unable to load sites.");
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    loadSites();
  }, [hasAccess, loadSites]);

  useEffect(() => {
    if (!hasAccess) return;

    let mounted = true;

    const loadSupervisors = async () => {
      try {
        const data = await fetchAllUsers();

        if (!mounted) return;

        const activeSupervisors = (Array.isArray(data) ? data : [])
          .filter(
            (item) =>
              String(item?.roleName || "").trim().toUpperCase() === "SUPERVISOR" &&
              String(item?.status || "").trim().toUpperCase() === "ACTIVE"
          )
          .sort((a, b) =>
            String(a?.name || "").localeCompare(String(b?.name || ""))
          );

        setSupervisors(activeSupervisors);
      } catch (err) {
        console.error("[SiteManagement] Failed to load supervisors:", err);
        if (mounted) {
          setError(err?.message || "Unable to load supervisors.");
        }
      }
    };

    loadSupervisors();

    return () => {
      mounted = false;
    };
  }, [hasAccess]);

  const handleSupervisorChange = (event) => {
    const supervisorId = event.target.value;
    setSelectedSupervisorId(supervisorId);

    const supervisor = supervisors.find(
      (item) => String(item.id) === String(supervisorId)
    );

    if (!supervisor) {
      setSelectedSupervisorSites([]);
      return;
    }

    const rawSiteCode = String(supervisor.siteCode || "").trim();

    if (rawSiteCode.toUpperCase() === "ALL") {
      setSelectedSupervisorSites(
        sites
          .filter((site) => site.active)
          .map((site) => site.siteCode)
      );
      return;
    }

    const assignedSites = rawSiteCode
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);

    setSelectedSupervisorSites(assignedSites);
  };

  const handleSupervisorSiteToggle = (siteCodeValue) => {
    setSelectedSupervisorSites((current) => {
      const exists = current.some(
        (code) =>
          String(code).toUpperCase() ===
          String(siteCodeValue).toUpperCase()
      );

      if (exists) {
        return current.filter(
          (code) =>
            String(code).toUpperCase() !==
            String(siteCodeValue).toUpperCase()
        );
      }

      return [...current, siteCodeValue];
    });
  };

  const handleSaveSupervisorAssignment = async () => {
    if (!selectedSupervisorId) {
      setError("Please select a supervisor.");
      return;
    }

    if (selectedSupervisorSites.length === 0) {
      setError("Please select at least one site.");
      return;
    }

    const supervisor = supervisors.find(
      (item) => String(item.id) === String(selectedSupervisorId)
    );

    if (!supervisor) {
      setError("Selected supervisor was not found.");
      return;
    }

    try {
      setSavingAssignment(true);
      setError("");
      setMessage("");

      const isAllSiteSupervisor =
        ["SP001", "SP002"].includes(
          String(supervisor.employeeId || "").trim().toUpperCase()
        ) ||
        String(supervisor.siteCode || "").trim().toUpperCase() === "ALL";

      const siteCodeValue = isAllSiteSupervisor
        ? "ALL"
        : selectedSupervisorSites.join(",");

      const updatedSupervisor = await updateEmployee(
        supervisor.id,
        { siteCode: siteCodeValue }
      );

      setSupervisors((current) =>
        current.map((item) =>
          String(item.id) === String(supervisor.id)
            ? { ...item, siteCode: updatedSupervisor?.siteCode || siteCodeValue }
            : item
        )
      );

      setMessage(
        `Sites assigned successfully to ${supervisor.name} (${supervisor.employeeId}).`
      );
    } catch (err) {
      console.error(
        "[SiteManagement] Failed to save supervisor assignment:",
        err
      );
      setError(err?.message || "Unable to save supervisor assignment.");
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleSiteNameChange = (event) => {
    const value = event.target.value;
    setSiteName(value);

    const generatedCode = value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    setSiteCode(generatedCode);
  };

  const handleAddSupervisor = async (event) => {
    event.preventDefault();

    const employeeIdValue = newSupervisorEmployeeId.trim().toUpperCase();
    const nameValue = newSupervisorName.trim();
    const emailValue = newSupervisorEmail.trim();
    const contactValue = newSupervisorContactNo.trim();

    if (!employeeIdValue || !nameValue) {
      setError("Employee ID and supervisor name are required.");
      return;
    }

    try {
      setAddingSupervisor(true);
      setError("");
      setMessage("");

      const createdSupervisor = await addSupervisor({
        employeeId: employeeIdValue,
        name: nameValue,
        email: emailValue || null,
        contactNo: contactValue || null,
      });

      if (createdSupervisor) {
        setSupervisors((current) =>
          [...current, createdSupervisor].sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          )
        );
      }

      setNewSupervisorEmployeeId("");
      setNewSupervisorName("");
      setNewSupervisorEmail("");
      setNewSupervisorContactNo("");
      setShowAddSupervisor(false);

      setMessage("Supervisor added successfully.");
    } catch (err) {
      console.error("[SiteManagement] Failed to add supervisor:", err);
      setError(err?.message || "Unable to add supervisor.");
    } finally {
      setAddingSupervisor(false);
    }
  };

  const handleDeactivateSupervisor = async (supervisor) => {
    const employeeIdValue = String(supervisor?.employeeId || "")
      .trim()
      .toUpperCase();

    if (["SP001", "SP002"].includes(employeeIdValue)) {
      setError("SP001 and SP002 cannot be deactivated.");
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${supervisor?.name || "this supervisor"} (${employeeIdValue})?`
    );

    if (!confirmed) return;

    try {
      setDeactivatingSupervisorId(String(supervisor.id));
      setError("");
      setMessage("");

      await deactivateSupervisor(supervisor.id);

      setSupervisors((current) =>
        current.filter(
          (item) => String(item.id) !== String(supervisor.id)
        )
      );

      if (String(selectedSupervisorId) === String(supervisor.id)) {
        setSelectedSupervisorId("");
        setSelectedSupervisorSites([]);
      }

      setMessage("Supervisor deactivated successfully.");
    } catch (err) {
      console.error(
        "[SiteManagement] Failed to deactivate supervisor:",
        err
      );
      setError(err?.message || "Unable to deactivate supervisor.");
    } finally {
      setDeactivatingSupervisorId("");
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanName = siteName.trim();
    const cleanCode = siteCode.trim();

    if (!cleanName || !cleanCode) {
      setError("Site name and site code are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await createSite({
        siteName: cleanName,
        siteCode: cleanCode,
        active: true,
      });

      setSiteName("");
      setSiteCode("");
      setMessage("Site added successfully.");

      await loadSites();
    } catch (err) {
      console.error("[SiteManagement] Failed to create site:", err);
      setError(err?.message || "Unable to add site.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (site) => {
    try {
      setError("");
      setMessage("");

      const newStatus = !Boolean(site.active);

      await updateSiteStatus(site.id, newStatus);

      setMessage(
        newStatus
          ? `${site.siteName} activated successfully.`
          : `${site.siteName} deactivated successfully.`
      );

      await loadSites();
    } catch (err) {
      console.error("[SiteManagement] Failed to update status:", err);
      setError(err?.message || "Unable to update site status.");
    }
  };

  if (!hasAccess) {
    return (
      <Layout title="Site Management">
        <div className="site-management-page">
          <div className="site-access-denied">
            <h2>Access Denied</h2>
            <p>You do not have permission to manage sites.</p>
            <button type="button" onClick={() => navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Site Management">
      <div className="site-management-page">
        <div className="site-management-header">
          <div>
            <h1>Site Management</h1>
            <p>Add new sites and control their active status.</p>
          </div>

          <div className="site-count">
            Total Sites: <strong>{sites.length}</strong>
          </div>
        </div>

        {message && <div className="site-success-message">{message}</div>}
        {error && <div className="site-error-message">{error}</div>}

        <div className="site-management-card">
          <h2>Add New Site</h2>

          <form className="site-form" onSubmit={handleSubmit}>
            <div className="site-form-group">
              <label htmlFor="siteName">Site Name</label>
              <input
                id="siteName"
                type="text"
                value={siteName}
                onChange={handleSiteNameChange}
                placeholder="Example: Duville Estates Private Limited"
                disabled={saving}
              />
            </div>

            <div className="site-form-group">
              <label htmlFor="siteCode">Site Code</label>
              <input
                id="siteCode"
                type="text"
                value={siteCode}
                onChange={(event) =>
                  setSiteCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]/g, "_")
                  )
                }
                placeholder="DUVILLE_ESTATES_PRIVATE_LIMITED"
                disabled={saving}
              />
              <small>
                Site code is generated automatically. You can edit it before saving.
              </small>
            </div>

            <button
              className="site-add-button"
              type="submit"
              disabled={saving}
            >
              {saving ? "Adding..." : "Add Site"}
            </button>
          </form>
        </div>

        <div className="site-management-card">
          <h2>Supervisor Site Assignment</h2>
          <p className="site-assignment-help">
            Select a supervisor and choose one or more sites to assign.
          </p>

          <div className="site-form-group">
            <label>Supervisor</label>

            <div className="supervisor-dropdown">
              <button
                type="button"
                className="supervisor-dropdown-toggle"
                onClick={() =>
                  setSupervisorDropdownOpen((current) => !current)
                }
                disabled={savingAssignment}
              >
                <span>
                  {selectedSupervisorId
                    ? (() => {
                        const selected = supervisors.find(
                          (item) =>
                            String(item.id) ===
                            String(selectedSupervisorId)
                        );

                        return selected
                          ? `${selected.name} (${selected.employeeId})`
                          : "Select Supervisor";
                      })()
                    : "Select Supervisor"}
                </span>

                <span>{supervisorDropdownOpen ? "▲" : "▼"}</span>
              </button>

              {supervisorDropdownOpen && (
                <div className="supervisor-dropdown-menu">
                  <button
                    type="button"
                    className="supervisor-add-option"
                    onClick={() => {
                      setShowAddSupervisor(true);
                      setSupervisorDropdownOpen(false);
                      setError("");
                      setMessage("");
                    }}
                  >
                    + Add New Supervisor
                  </button>

                  {supervisors.length === 0 ? (
                    <div className="supervisor-empty-option">
                      No active supervisors found.
                    </div>
                  ) : (
                    supervisors.map((supervisor) => {
                      const supervisorEmployeeId = String(
                        supervisor.employeeId || ""
                      )
                        .trim()
                        .toUpperCase();

                      const protectedSupervisor = [
                        "SP001",
                        "SP002",
                      ].includes(supervisorEmployeeId);

                      return (
                        <div
                          key={supervisor.id}
                          className="supervisor-dropdown-item"
                        >
                          <button
                            type="button"
                            className="supervisor-select-option"
                            onClick={() => {
                              handleSupervisorChange({
                                target: {
                                  value: String(supervisor.id),
                                },
                              });
                              setSupervisorDropdownOpen(false);
                            }}
                          >
                            <span>{supervisor.name}</span>
                            <small>
                              {supervisor.employeeId}
                            </small>
                          </button>

                          {!protectedSupervisor && (
                            <button
                              type="button"
                              className="supervisor-delete-button"
                              title="Deactivate Supervisor"
                              disabled={
                                String(deactivatingSupervisorId) ===
                                String(supervisor.id)
                              }
                              onClick={() =>
                                handleDeactivateSupervisor(supervisor)
                              }
                            >
                              {String(deactivatingSupervisorId) ===
                              String(supervisor.id)
                                ? "..."
                                : "🗑"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {showAddSupervisor && (
              <form
                className="supervisor-add-form"
                onSubmit={handleAddSupervisor}
              >
                <div className="supervisor-add-form-heading">
                  <h3>Add New Supervisor</h3>

                  <button
                    type="button"
                    className="supervisor-form-close"
                    onClick={() => setShowAddSupervisor(false)}
                    disabled={addingSupervisor}
                  >
                    ×
                  </button>
                </div>

                <div className="supervisor-form-grid">
                  <input
                    type="text"
                    value={newSupervisorEmployeeId}
                    onChange={(event) =>
                      setNewSupervisorEmployeeId(event.target.value)
                    }
                    placeholder="Employee ID *"
                    disabled={addingSupervisor}
                    required
                  />

                  <input
                    type="text"
                    value={newSupervisorName}
                    onChange={(event) =>
                      setNewSupervisorName(event.target.value)
                    }
                    placeholder="Supervisor Name *"
                    disabled={addingSupervisor}
                    required
                  />

                  <input
                    type="email"
                    value={newSupervisorEmail}
                    onChange={(event) =>
                      setNewSupervisorEmail(event.target.value)
                    }
                    placeholder="Email (Optional)"
                    disabled={addingSupervisor}
                  />

                  <input
                    type="text"
                    value={newSupervisorContactNo}
                    onChange={(event) =>
                      setNewSupervisorContactNo(event.target.value)
                    }
                    placeholder="Contact Number (Optional)"
                    disabled={addingSupervisor}
                  />
                </div>

                <button
                  type="submit"
                  className="site-add-button"
                  disabled={addingSupervisor}
                >
                  {addingSupervisor
                    ? "Adding Supervisor..."
                    : "Add Supervisor"}
                </button>
              </form>
            )}
          </div>

          {selectedSupervisorId && (
            <div className="supervisor-site-section">
              <h3>Assigned Sites</h3>

              {sites.filter((site) => site.active).length === 0 ? (
                <div className="site-empty-state">
                  No active sites available.
                </div>
              ) : (
                <div className="supervisor-site-grid">
                  {sites
                    .filter((site) => site.active)
                    .map((site) => {
                      const checked = selectedSupervisorSites.some(
                        (code) =>
                          String(code).toUpperCase() ===
                          String(site.siteCode).toUpperCase()
                      );

                      return (
                        <label
                          key={site.id}
                          className={
                            checked
                              ? "supervisor-site-option selected"
                              : "supervisor-site-option"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleSupervisorSiteToggle(site.siteCode)
                            }
                            disabled={savingAssignment}
                          />

                          <span>
                            <strong>{site.siteName}</strong>
                            <small>{site.siteCode}</small>
                          </span>
                        </label>
                      );
                    })}
                </div>
              )}

              <button
                type="button"
                className="site-add-button"
                onClick={handleSaveSupervisorAssignment}
                disabled={
                  savingAssignment ||
                  selectedSupervisorSites.length === 0
                }
              >
                {savingAssignment
                  ? "Saving Assignment..."
                  : "Save Assignment"}
              </button>
            </div>
          )}
        </div>

        <div className="site-management-card">
          <div className="site-list-heading">
            <h2>All Sites</h2>

            <button
              type="button"
              className="site-refresh-button"
              onClick={loadSites}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="site-empty-state">Loading sites...</div>
          ) : sites.length === 0 ? (
            <div className="site-empty-state">No sites found.</div>
          ) : (
            <div className="site-table-wrapper">
              <table className="site-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Site Name</th>
                    <th>Site Code</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {sites.map((site, index) => (
                    <tr key={site.id}>
                      <td>{index + 1}</td>
                      <td>{site.siteName}</td>
                      <td>
                        <span className="site-code">{site.siteCode}</span>
                      </td>
                      <td>
                        <span
                          className={
                            site.active
                              ? "site-status active"
                              : "site-status inactive"
                          }
                        >
                          {site.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={
                            site.active
                              ? "site-status-button deactivate"
                              : "site-status-button activate"
                          }
                          onClick={() => handleStatusChange(site)}
                        >
                          {site.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default SiteManagement;