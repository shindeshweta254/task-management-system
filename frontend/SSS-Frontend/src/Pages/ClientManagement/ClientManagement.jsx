import { useCallback, useEffect, useMemo, useState } from "react";

import Layout from "../../components/Layout/Layout";
import "./ClientManagement.css";

import {
  fetchClients,
  fetchClientFollowUps,
  fetchTodayFollowUps,
  fetchOverdueFollowUps,
  createClient,
  updateClient,
  deactivateClient,
  createClientFollowUp,
  completeClientFollowUp,
} from "../../api/clientApi";

import { API_BASE_URL, apiFetch } from "../../api/index";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);

  const [activeTab, setActiveTab] = useState("clients");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedFollowUpClient, setSelectedFollowUpClient] = useState(null);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const [showCompleteFollowUpModal, setShowCompleteFollowUpModal] = useState(false);
  const [selectedCompleteFollowUp, setSelectedCompleteFollowUp] = useState(null);
  const [completingFollowUp, setCompletingFollowUp] = useState(false);

  const [completeFollowUpForm, setCompleteFollowUpForm] = useState({
    outcome: "",
    nextFollowUpDate: "",
  });

  const [followUpForm, setFollowUpForm] = useState({
    followUpDate: "",
    followUpType: "CALL",
    notes: "",
    nextFollowUpDate: "",
  });

  const [clientForm, setClientForm] = useState({
    clientName: "",
    companyName: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
    siteCode: "",
    serviceType: "",
    contactSource: "",
    requiredDate: "",
    quoteStatus: "NOT_SENT",
    status: "NEW",
    nextFollowUpDate: "",
    remarks: "",
  });

  const siteOptions = useMemo(() => {
    return [...new Set(
      employees
        .flatMap((emp) =>
          String(emp?.siteCode || "").split(",")
        )
        .map((site) => site.trim())
        .filter(
          (site) =>
            site &&
            site.toUpperCase() !== "ALL"
        )
    )].sort();
  }, [employees]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        clientData,
        followUpData,
        todayData,
        overdueData,
      ] = await Promise.all([
        fetchClients(),
        fetchClientFollowUps(),
        fetchTodayFollowUps(),
        fetchOverdueFollowUps(),
      ]);

      setClients(clientData);
      setFollowUps(followUpData);
      setTodayFollowUps(todayData);
      setOverdueFollowUps(overdueData);
    } catch (err) {
      console.error("Client Management load failed:", err);
      setError(
        err?.message || "Unable to load client management data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployeesForSites() {
      try {
        const data = await apiFetch(`${API_BASE_URL}/api/users`);

        if (!cancelled) {
          setEmployees(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Unable to load CRM site options:", err);

        if (!cancelled) {
          setEmployees([]);
        }
      }
    }

    loadEmployeesForSites();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClientFormChange = (event) => {
    const { name, value } = event.target;

    setClientForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetClientForm = () => {
    setClientForm({
      clientName: "",
      companyName: "",
      contactPerson: "",
      contactNumber: "",
      email: "",
      siteCode: "",
      serviceType: "",
      contactSource: "",
      requiredDate: "",
      quoteStatus: "NOT_SENT",
      status: "NEW",
      nextFollowUpDate: "",
      remarks: "",
    });
  };

  const handleEditClient = (client) => {
    setError("");
    setEditingClientId(client.id);

    setClientForm({
      clientName: client.clientName || "",
      companyName: client.companyName || "",
      contactPerson: client.contactPerson || "",
      contactNumber: client.contactNumber || "",
      email: client.email || "",
      siteCode: client.siteCode || "",
      serviceType: client.serviceType || "",
      contactSource: client.contactSource || "",
      requiredDate: client.requiredDate || "",
      quoteStatus: client.quoteStatus || "NOT_SENT",
      status: client.status || "NEW",
      nextFollowUpDate: client.nextFollowUpDate || "",
      remarks: client.remarks || "",
    });

    setShowAddClient(true);
  };

  const handleCreateClient = async (event) => {
    event.preventDefault();

    if (!clientForm.clientName.trim()) {
      setError("Client name is required.");
      return;
    }

    if (!clientForm.siteCode.trim()) {
      setError("Site is required.");
      return;
    }

    setSavingClient(true);
    setError("");

    try {
      const payload = {
        ...clientForm,
        clientName: clientForm.clientName.trim(),
        companyName: clientForm.companyName.trim(),
        contactPerson: clientForm.contactPerson.trim(),
        contactNumber: clientForm.contactNumber.trim(),
        email: clientForm.email.trim(),
        siteCode: clientForm.siteCode.trim(),
        serviceType: clientForm.serviceType.trim(),
        contactSource: clientForm.contactSource.trim(),
        remarks: clientForm.remarks.trim(),
        requiredDate: clientForm.requiredDate || null,
        nextFollowUpDate: clientForm.nextFollowUpDate || null,
      };

      if (editingClientId) {
        await updateClient(editingClientId, payload);
      } else {
        await createClient(payload);
      }

      resetClientForm();
      setEditingClientId(null);
      setShowAddClient(false);
      await loadData();
      setActiveTab("clients");
    } catch (err) {
      console.error("Client creation failed:", err);
      setError(err?.message || "Unable to create client.");
    } finally {
      setSavingClient(false);
    }
  };

  const handleDeleteClient = async (client) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${client.clientName}"?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deactivateClient(client.id);
      await loadData();
    } catch (err) {
      console.error("Client delete failed:", err);
      setError(err?.message || "Unable to delete client.");
    }
  };

  const handleNewFollowUp = (client) => {
    setError("");
    setSelectedFollowUpClient(client);

    setFollowUpForm({
      followUpDate: new Date().toISOString().split("T")[0],
      followUpType: "CALL",
      notes: "",
      nextFollowUpDate: "",
    });

    setShowFollowUpModal(true);
  };

  const handleFollowUpFormChange = (event) => {
    const { name, value } = event.target;

    setFollowUpForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveFollowUp = async (event) => {
    event.preventDefault();

    if (!selectedFollowUpClient?.id) {
      setError("Please select a client.");
      return;
    }

    if (!followUpForm.followUpDate) {
      setError("Follow-up date is required.");
      return;
    }

    setSavingFollowUp(true);
    setError("");

    try {
      await createClientFollowUp(selectedFollowUpClient.id, {
        followUpDate: followUpForm.followUpDate,
        followUpType: followUpForm.followUpType || "CALL",
        notes: followUpForm.notes.trim(),
        nextFollowUpDate: followUpForm.nextFollowUpDate || null,
      });

      setShowFollowUpModal(false);
      setSelectedFollowUpClient(null);

      setFollowUpForm({
        followUpDate: "",
        followUpType: "CALL",
        notes: "",
        nextFollowUpDate: "",
      });

      await loadData();
      setActiveTab("follow-ups");
    } catch (err) {
      console.error("Client follow-up save failed:", err);
      setError(err?.message || "Unable to save client follow-up.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleOpenCompleteFollowUp = (followUp) => {
    setError("");
    setSelectedCompleteFollowUp(followUp);

    setCompleteFollowUpForm({
      outcome: "",
      nextFollowUpDate: "",
    });

    setShowCompleteFollowUpModal(true);
  };

  const handleCompleteFollowUpFormChange = (event) => {
    const { name, value } = event.target;

    setCompleteFollowUpForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCompleteFollowUp = async (event) => {
    event.preventDefault();

    if (!selectedCompleteFollowUp?.id) {
      setError("Please select a follow-up.");
      return;
    }

    setCompletingFollowUp(true);
    setError("");

    try {
      await completeClientFollowUp(
        selectedCompleteFollowUp.id,
        completeFollowUpForm.outcome.trim(),
        completeFollowUpForm.nextFollowUpDate || null
      );

      setShowCompleteFollowUpModal(false);
      setSelectedCompleteFollowUp(null);

      setCompleteFollowUpForm({
        outcome: "",
        nextFollowUpDate: "",
      });

      await loadData();
      setActiveTab("follow-ups");
    } catch (err) {
      console.error("Complete follow-up failed:", err);
      setError(err?.message || "Unable to complete follow-up.");
    } finally {
      setCompletingFollowUp(false);
    }
  };

  const pendingFollowUps = useMemo(
    () =>
      followUps.filter(
        (followUp) => !Boolean(followUp?.completed)
      ),
    [followUps]
  );

  const renderClients = () => (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact Person</th>
            <th>Mobile</th>
            <th>Site</th>
            <th>Service</th>
            <th>Quote Status</th>
            <th>Status</th>
            <th>Next Follow-Up</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {clients.length === 0 ? (
            <tr>
              <td colSpan="9" className="crm-empty">
                No clients found.
              </td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.clientName || "-"}</strong>
                  {client.companyName && (
                    <small className="crm-subtext">
                      {client.companyName}
                    </small>
                  )}
                </td>

                <td>{client.contactPerson || "-"}</td>
                <td>{client.contactNumber || "-"}</td>
                <td>{client.siteCode || "-"}</td>
                <td>{client.serviceType || "-"}</td>
                <td>{client.quoteStatus || "-"}</td>
                <td>{client.status || "-"}</td>
                <td>{formatDate(client.nextFollowUpDate)}</td>
                <td>
                  <div className="crm-action-buttons">
                    <button
                      type="button"
                      className="crm-edit-btn"
                      onClick={() => handleEditClient(client)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="crm-followup-btn"
                      onClick={() => handleNewFollowUp(client)}
                    >
                      + Follow-Up
                    </button>

                    <button
                      type="button"
                      className="crm-delete-btn"
                      onClick={() => handleDeleteClient(client)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFollowUps = (records, emptyMessage) => (
    <div className="crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Site</th>
            <th>Follow-Up Date</th>
            <th>Type</th>
            <th>Notes</th>
            <th>Outcome</th>
            <th>Followed By</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="9" className="crm-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            records.map((followUp) => (
              <tr key={followUp.id}>
                <td>{followUp.clientName || "-"}</td>
                <td>{followUp.siteCode || "-"}</td>
                <td>{formatDate(followUp.followUpDate)}</td>
                <td>{followUp.followUpType || "-"}</td>
                <td>{followUp.notes || "-"}</td>
                <td>{followUp.outcome || "-"}</td>
                <td>{followUp.followedUpByName || "-"}</td>
                <td>
                  <span
                    className={
                      followUp.completed
                        ? "crm-badge crm-completed"
                        : "crm-badge crm-pending"
                    }
                  >
                    {followUp.completed
                      ? "Completed"
                      : "Pending"}
                  </span>

                  {!followUp.completed && (
                    <button
                      type="button"
                      className="crm-complete-btn"
                      onClick={() => handleOpenCompleteFollowUp(followUp)}
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout title="Client Management">
      <div className="crm-page">
        <div className="crm-header">
          <div>
            <h2>Client Follow-Up CRM</h2>
            <p>
              Manage clients, communication, follow-ups and reminders.
            </p>
          </div>

          <button
            type="button"
            className="crm-primary-btn"
            onClick={() => {
              setError("");
              setEditingClientId(null);
              resetClientForm();
              setShowAddClient(true);
            }}
          >
            + Add Client
          </button>
        </div>

        <div className="crm-summary-grid">
          <div className="crm-summary-card">
            <span>Total Clients</span>
            <strong>{clients.length}</strong>
          </div>

          <div className="crm-summary-card">
            <span>Pending Follow-Ups</span>
            <strong>{pendingFollowUps.length}</strong>
          </div>

          <div className="crm-summary-card">
            <span>Today's Follow-Ups</span>
            <strong>{todayFollowUps.length}</strong>
          </div>

          <div className="crm-summary-card">
            <span>Overdue Follow-Ups</span>
            <strong>{overdueFollowUps.length}</strong>
          </div>
        </div>

        {error && (
          <div className="crm-alert crm-error">
            {error}
          </div>
        )}

        <div className="crm-tabs">
          <button
            type="button"
            className={activeTab === "clients" ? "active" : ""}
            onClick={() => setActiveTab("clients")}
          >
            Clients
          </button>

          <button
            type="button"
            className={activeTab === "follow-ups" ? "active" : ""}
            onClick={() => setActiveTab("follow-ups")}
          >
            Follow-Ups
          </button>

          <button
            type="button"
            className={activeTab === "reminders" ? "active" : ""}
            onClick={() => setActiveTab("reminders")}
          >
            Reminders ({todayFollowUps.length + overdueFollowUps.length})
          </button>
        </div>

        <section className="crm-card">
          {loading ? (
            <div className="crm-loading">
              Loading client management...
            </div>
          ) : activeTab === "clients" ? (
            renderClients()
          ) : activeTab === "follow-ups" ? (
            renderFollowUps(
              followUps,
              "No client follow-up records found."
            )
          ) : (
            <>
              <div className="crm-section-heading">
                <h3>Today's Follow-Ups</h3>
                <span>{todayFollowUps.length}</span>
              </div>

              {renderFollowUps(
                todayFollowUps,
                "No follow-ups due today."
              )}

              <div className="crm-section-heading crm-overdue-heading">
                <h3>Overdue Follow-Ups</h3>
                <span>{overdueFollowUps.length}</span>
              </div>

              {renderFollowUps(
                overdueFollowUps,
                "No overdue follow-ups."
              )}
            </>
          )}
        </section>
        {showAddClient && (
          <div
            className="crm-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingClient) {
                setShowAddClient(false);
              }
            }}
          >
            <div className="crm-modal">
              <div className="crm-modal-header">
                <div>
                  <h3>{editingClientId ? "Edit Client" : "Add Client"}</h3>
                  <p>
                    {editingClientId
                      ? "Update client details and follow-up information."
                      : "Add client details and follow-up information."}
                  </p>
                </div>

                <button
                  type="button"
                  className="crm-close-btn"
                  onClick={() => {
                    resetClientForm();
                    setEditingClientId(null);
                    setShowAddClient(false);
                  }}
                  disabled={savingClient}
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateClient}>
                <div className="crm-form-grid">
                  <label>
                    Client Name *
                    <input
                      type="text"
                      name="clientName"
                      value={clientForm.clientName}
                      onChange={handleClientFormChange}
                      required
                    />
                  </label>

                  <label>
                    Company Name
                    <input
                      type="text"
                      name="companyName"
                      value={clientForm.companyName}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Contact Person
                    <input
                      type="text"
                      name="contactPerson"
                      value={clientForm.contactPerson}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Mobile Number
                    <input
                      type="tel"
                      name="contactNumber"
                      value={clientForm.contactNumber}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={clientForm.email}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Site *
                    <select
                      name="siteCode"
                      value={clientForm.siteCode}
                      onChange={handleClientFormChange}
                      required
                    >
                      <option value="">Select Site</option>
                      {siteOptions.map((site) => (
                        <option key={site} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Service
                    <input
                      type="text"
                      name="serviceType"
                      value={clientForm.serviceType}
                      onChange={handleClientFormChange}
                      placeholder="e.g. Housekeeping"
                    />
                  </label>

                  <label>
                    Contact Source
                    <select
                      name="contactSource"
                      value={clientForm.contactSource}
                      onChange={handleClientFormChange}
                    >
                      <option value="">Select Source</option>
                      <option value="REFERENCE">Reference</option>
                      <option value="CALL">Call</option>
                      <option value="WEBSITE">Website</option>
                      <option value="EMAIL">Email</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>

                  <label>
                    Required Date
                    <input
                      type="date"
                      name="requiredDate"
                      value={clientForm.requiredDate}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Next Follow-Up
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={clientForm.nextFollowUpDate}
                      onChange={handleClientFormChange}
                    />
                  </label>

                  <label>
                    Quote Status
                    <select
                      name="quoteStatus"
                      value={clientForm.quoteStatus}
                      onChange={handleClientFormChange}
                    >
                      <option value="NOT_SENT">Not Sent</option>
                      <option value="SENT">Sent</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </label>

                  <label>
                    Client Status
                    <select
                      name="status"
                      value={clientForm.status}
                      onChange={handleClientFormChange}
                    >
                      <option value="NEW">New</option>
                      <option value="FOLLOW_UP">Follow-Up</option>
                      <option value="QUOTE_SENT">Quote Sent</option>
                      <option value="WAITING">Waiting</option>
                      <option value="BOOKED">Booked</option>
                      <option value="DECLINED">Declined</option>
                      <option value="NO_RESPONSE">No Response</option>
                    </select>
                  </label>

                  <label className="crm-full-field">
                    Remarks / Notes
                    <textarea
                      name="remarks"
                      rows="3"
                      value={clientForm.remarks}
                      onChange={handleClientFormChange}
                    />
                  </label>
                </div>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="crm-secondary-btn"
                    disabled={savingClient}
                    onClick={() => {
                      resetClientForm();
                      setEditingClientId(null);
                      setShowAddClient(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="crm-primary-btn"
                    disabled={savingClient}
                  >
                    {savingClient
                      ? "Saving..."
                      : editingClientId
                        ? "Update Client"
                        : "Save Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFollowUpModal && selectedFollowUpClient && (
          <div
            className="crm-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingFollowUp) {
                setShowFollowUpModal(false);
                setSelectedFollowUpClient(null);
              }
            }}
          >
            <div className="crm-modal">
              <div className="crm-modal-header">
                <div>
                  <h3>New Follow-Up</h3>
                  <p>
                    Client: {selectedFollowUpClient.clientName || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  className="crm-close-btn"
                  disabled={savingFollowUp}
                  onClick={() => {
                    setShowFollowUpModal(false);
                    setSelectedFollowUpClient(null);
                  }}
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSaveFollowUp}>
                <div className="crm-form-grid">
                  <label>
                    Follow-Up Date *
                    <input
                      type="date"
                      name="followUpDate"
                      value={followUpForm.followUpDate}
                      onChange={handleFollowUpFormChange}
                      required
                    />
                  </label>

                  <label>
                    Follow-Up Type
                    <select
                      name="followUpType"
                      value={followUpForm.followUpType}
                      onChange={handleFollowUpFormChange}
                    >
                      <option value="CALL">Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="MEETING">Meeting</option>
                      <option value="VISIT">Visit</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>

                  <label>
                    Next Follow-Up Date
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={followUpForm.nextFollowUpDate}
                      onChange={handleFollowUpFormChange}
                    />
                  </label>

                  <label className="crm-full-field">
                    Notes
                    <textarea
                      name="notes"
                      rows="4"
                      value={followUpForm.notes}
                      onChange={handleFollowUpFormChange}
                      placeholder="Enter discussion or follow-up notes"
                    />
                  </label>
                </div>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="crm-secondary-btn"
                    disabled={savingFollowUp}
                    onClick={() => {
                      setShowFollowUpModal(false);
                      setSelectedFollowUpClient(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="crm-primary-btn"
                    disabled={savingFollowUp}
                  >
                    {savingFollowUp ? "Saving..." : "Save Follow-Up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCompleteFollowUpModal && selectedCompleteFollowUp && (
          <div
            className="crm-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !completingFollowUp
              ) {
                setShowCompleteFollowUpModal(false);
                setSelectedCompleteFollowUp(null);
              }
            }}
          >
            <div className="crm-modal">
              <div className="crm-modal-header">
                <div>
                  <h3>Complete Follow-Up</h3>
                  <p>
                    Client: {selectedCompleteFollowUp.clientName || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  className="crm-close-btn"
                  disabled={completingFollowUp}
                  onClick={() => {
                    setShowCompleteFollowUpModal(false);
                    setSelectedCompleteFollowUp(null);
                  }}
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCompleteFollowUp}>
                <div className="crm-form-grid">
                  <label className="crm-full-field">
                    Outcome
                    <textarea
                      name="outcome"
                      rows="4"
                      value={completeFollowUpForm.outcome}
                      onChange={handleCompleteFollowUpFormChange}
                      placeholder="Enter follow-up outcome"
                    />
                  </label>

                  <label>
                    Next Follow-Up Date
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={completeFollowUpForm.nextFollowUpDate}
                      onChange={handleCompleteFollowUpFormChange}
                    />
                  </label>
                </div>

                <div className="crm-modal-actions">
                  <button
                    type="button"
                    className="crm-secondary-btn"
                    disabled={completingFollowUp}
                    onClick={() => {
                      setShowCompleteFollowUpModal(false);
                      setSelectedCompleteFollowUp(null);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="crm-primary-btn"
                    disabled={completingFollowUp}
                  >
                    {completingFollowUp
                      ? "Completing..."
                      : "Complete Follow-Up"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ClientManagement;