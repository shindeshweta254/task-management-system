import { useCallback, useEffect, useMemo, useState } from "react";

import Layout from "../../components/Layout/Layout";
import "./IncidentManagement.css";

import {
  fetchIncidents,
  createIncident,
  updateIncident,
} from "../../api/incidentApi";

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch (error) {
    console.error("Invalid localStorage user:", error);
    return {};
  }
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

const emptyForm = {
  title: "",
  description: "",
  category: "INCIDENT",
  priority: "MEDIUM",
  siteCode: "",
  incidentDate: new Date().toISOString().slice(0, 10),
};

function IncidentManagement() {
  const user = getLoggedInUser();

  const role = String(
    user?.roleName || user?.role?.roleName || "EMPLOYEE"
  ).toUpperCase();

  const canManage = [
    "DIRECTOR",
    "SUPERVISOR",
    "MANAGER",
    "OWNER",
    "ADMIN",
    "OWNER/ADMIN",
  ].includes(role);

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [status, setStatus] = useState("OPEN");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (err) {
      setError(err?.message || "Unable to load incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const summary = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter((item) => item.status === "OPEN").length,
      inProgress: incidents.filter(
        (item) => item.status === "IN_PROGRESS"
      ).length,
      resolved: incidents.filter(
        (item) => item.status === "RESOLVED"
      ).length,
    };
  }, [incidents]);

  const handleCreate = async (event) => {
    event.preventDefault();

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await createIncident({
        ...form,
        siteCode: form.siteCode.trim(),
      });

      setForm(emptyForm);
      setShowForm(false);
      setMessage("Incident / complaint submitted successfully.");
      await loadIncidents();
    } catch (err) {
      setError(err?.message || "Unable to submit incident.");
    } finally {
      setActionLoading(false);
    }
  };

  const openManage = (incident) => {
    setSelectedIncident(incident);
    setStatus(incident.status || "OPEN");
    setResolutionNotes(incident.resolutionNotes || "");
    setError("");
    setMessage("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedIncident) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await updateIncident(selectedIncident.id, {
        status,
        resolutionNotes,
      });

      setSelectedIncident(null);
      setMessage("Incident updated successfully.");
      await loadIncidents();
    } catch (err) {
      setError(err?.message || "Unable to update incident.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout title="Incident / Complaint Management">
      <div className="incident-page">
        <div className="incident-header">
          <div>
            <h2>Incident / Complaint Management</h2>
            <p>
              Report incidents and complaints and track their resolution.
            </p>
          </div>

          <button
            className="incident-primary-btn"
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setSelectedIncident(null);
              setError("");
              setMessage("");
            }}
          >
            {showForm ? "Close Form" : "+ Report New"}
          </button>
        </div>

        {error && <div className="incident-alert error">{error}</div>}
        {message && <div className="incident-alert success">{message}</div>}

        <div className="incident-summary">
          <div className="incident-summary-card">
            <span>Total</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="incident-summary-card">
            <span>Open</span>
            <strong>{summary.open}</strong>
          </div>

          <div className="incident-summary-card">
            <span>In Progress</span>
            <strong>{summary.inProgress}</strong>
          </div>

          <div className="incident-summary-card">
            <span>Resolved</span>
            <strong>{summary.resolved}</strong>
          </div>
        </div>

        {showForm && (
          <form className="incident-form-card" onSubmit={handleCreate}>
            <h3>Report Incident / Complaint</h3>

            <div className="incident-form-grid">
              <label>
                Type
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                >
                  <option value="INCIDENT">Incident</option>
                  <option value="COMPLAINT">Complaint</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value,
                    })
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>

              <label>
                Incident Date
                <input
                  type="date"
                  value={form.incidentDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      incidentDate: event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Site Code
                <input
                  type="text"
                  value={form.siteCode}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      siteCode: event.target.value,
                    })
                  }
                  placeholder="Example: KALPATARU_5AB"
                  required
                />
              </label>

              <label className="incident-full-field">
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                  placeholder="Enter incident / complaint title"
                  required
                />
              </label>

              <label className="incident-full-field">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe the issue"
                  rows="4"
                />
              </label>
            </div>

            <button
              className="incident-primary-btn"
              type="submit"
              disabled={actionLoading}
            >
              {actionLoading ? "Submitting..." : "Submit"}
            </button>
          </form>
        )}

        {selectedIncident && canManage && (
          <form className="incident-form-card" onSubmit={handleUpdate}>
            <h3>Manage: {selectedIncident.title}</h3>

            <div className="incident-form-grid">
              <label>
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>

              <label className="incident-full-field">
                Resolution Notes
                <textarea
                  value={resolutionNotes}
                  onChange={(event) =>
                    setResolutionNotes(event.target.value)
                  }
                  rows="3"
                  placeholder="Add resolution / action notes"
                />
              </label>
            </div>

            <div className="incident-actions">
              <button
                className="incident-primary-btn"
                type="submit"
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Update"}
              </button>

              <button
                className="incident-secondary-btn"
                type="button"
                onClick={() => setSelectedIncident(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="incident-table-card">
          <div className="incident-table-heading">
            <h3>{role === "EMPLOYEE" ? "My Reports" : "Incident Records"}</h3>

            <button
              type="button"
              className="incident-secondary-btn"
              onClick={loadIncidents}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="incident-empty">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="incident-empty">
              No incident or complaint records found.
            </div>
          ) : (
            <div className="incident-table-wrap">
              <table className="incident-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Title</th>
                    <th>Site</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Reported By</th>
                    <th>Date</th>
                    {canManage && <th>Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>{incident.id}</td>
                      <td>{incident.category || "-"}</td>
                      <td>
                        <strong>{incident.title}</strong>
                        {incident.description && (
                          <small className="incident-description">
                            {incident.description}
                          </small>
                        )}
                      </td>
                      <td>{incident.siteCode || "-"}</td>
                      <td>{incident.priority || "-"}</td>
                      <td>
                        <span
                          className={`incident-status ${String(
                            incident.status || ""
                          )
                            .toLowerCase()
                            .replace("_", "-")}`}
                        >
                          {String(incident.status || "-").replace("_", " ")}
                        </span>
                      </td>
                      <td>{incident.reportedBy?.name || "-"}</td>
                      <td>{formatDate(incident.incidentDate)}</td>

                      {canManage && (
                        <td>
                          <button
                            type="button"
                            className="incident-link-btn"
                            onClick={() => openManage(incident)}
                          >
                            Manage
                          </button>
                        </td>
                      )}
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

export default IncidentManagement;