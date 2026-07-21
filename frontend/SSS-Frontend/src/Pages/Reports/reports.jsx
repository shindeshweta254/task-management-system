import { useEffect, useMemo, useState } from "react";
import Layout from "../../Components/Layout/Layout";
import { t } from "../../i18n/translator";
import "./reports.css";

import {
  fetchAllWorkProofs,
  fetchMyWorkProofs,
  fetchSiteWorkProofs,
  fetchSiteUserWorkProofs,
  updateWorkProofStatus,
  uploadWorkProof,
} from "../../api/workProofApi";

const API_BASE = "http://localhost:8080/api";

function Reports() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const userId = user?.id || user?.userId || null;
  const roleName = user?.role?.roleName || "EMPLOYEE";

  const [activeTab, setActiveTab] = useState("submit");

  // Work Proof module (separate from existing daily reports)
  const [siteName, setSiteName] = useState("");

  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const [myWorkProofs, setMyWorkProofs] = useState([]);
  const [siteWorkProofs, setSiteWorkProofs] = useState([]);
  const [allWorkProofs, setAllWorkProofs] = useState([]);

  const [workersForSite, setWorkersForSite] = useState([]);

  const [directorStats, setDirectorStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    changesRequested: 0,
    total: 0,
  });
  const [busy, setBusy] = useState(false);

  const [completedWork, setCompletedWork] = useState("");
  const [pendingWork, setPendingWork] = useState("");
  const [issues, setIssues] = useState("");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [proofFile, setProofFile] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");

  const [message, setMessage] = useState("");
  const [myReports, setMyReports] = useState([]);
  const [allReports, setAllReports] = useState([]);

  const isOwner = roleName === "Owner/Admin" || roleName === "DIRECTOR" || roleName === "Director";
  const isDirectorLike = isOwner;
  const isSupervisor = roleName === "SUPERVISOR";
  const canSubmitWorkProof = roleName === "EMPLOYEE" || isSupervisor || isDirectorLike;
  const canViewSiteReports = isSupervisor || isDirectorLike;
  const canViewAllReports = isDirectorLike;
  const canViewMyReports = true;


  useEffect(() => {
    if (!userId) return;
    const fetchReports = async () => {
      try {
        const url = isOwner ? `${API_BASE}/reports` : `${API_BASE}/reports/user/${userId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (isOwner) setAllReports(data || []);
        else setMyReports(data || []);
      } catch (e) {
        // ignore
      }
    };
    fetchReports();
  }, [userId, isOwner]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported");
      return;
    }

    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        setMessage(err?.message || "Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("User not found");
      return;
    }
    if (!proofFile) {
      setMessage("Please upload daily work proof");
      return;
    }
    if (!coords) {
      setMessage("Please allow live location first");
      return;
    }

    try {
      setBusy(true);
      setMessage("");

      const form = new FormData();
      form.append("userId", String(userId));
      form.append("completedWork", completedWork);
      form.append("pendingWork", pendingWork);
      form.append("issues", issues);
      form.append("reportDate", reportDate);
      form.append("latitude", String(coords.latitude));
      form.append("longitude", String(coords.longitude));
      form.append("locationAddress", locationAddress || "");
      form.append("proof", proofFile);

      const res = await fetch(`${API_BASE}/reports/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Upload failed");
      }

      setMessage("Saved successfully ✅");
      setCompletedWork("");
      setPendingWork("");
      setIssues("");
      setProofFile(null);
      setCoords(null);
      setLocationAddress("");

      // refresh
      const refresh = await fetch(`${API_BASE}/reports/user/${userId}`);
      const data = await refresh.json();
      setMyReports(data || []);
    } catch (err) {
      setMessage(err?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const listToShow = isOwner ? allReports : myReports;

  return (
    <Layout title={t("nav.reports") || "Reports"}>
      <div className="reports-page">
        <div className="reports-tabs">
          {!isOwner && (
            <button
              type="button"
              className={`reports-tab-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
            >
              Upload Proof
            </button>
          )}
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            {t("reports.viewSubmissions") || "View Submissions"}
          </button>
        </div>

        {activeTab === "upload" && !isOwner && (
          <div className="page-card">
            <h2>Daily Work Proof Upload</h2>

            <form className="reports-form" onSubmit={onSubmit}>
              <div className="full">
                <label>Report Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>

              <div>
                <label>Completed Work</label>
                <textarea value={completedWork} onChange={(e) => setCompletedWork(e.target.value)} />
              </div>

              <div>
                <label>Pending Work</label>
                <textarea value={pendingWork} onChange={(e) => setPendingWork(e.target.value)} />
              </div>

              <div className="full">
                <label>Issues</label>
                <textarea value={issues} onChange={(e) => setIssues(e.target.value)} />
              </div>

              <div className="full">
                <label>Work Proof (Screenshot/Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="full">
                <label>Live Location</label>
                <div className="reports-actions">
                  <button type="button" className="reports-submit" onClick={requestLocation} disabled={busy}>
                    Get Location
                  </button>
                  <div className="reports-location">
                    {coords ? (
                      <span>
                        Lat: {coords.latitude} , Lng: {coords.longitude}
                      </span>
                    ) : (
                      <span>Not captured yet</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ marginBottom: 6, display: "block", fontSize: 13, color: "#374151" }}>
                    Location Address (optional)
                  </label>
                  <input
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Street/Area"
                  />
                </div>
              </div>

              <div className="full">
                <button type="submit" className="reports-submit" disabled={busy}>
                  {busy ? "Saving..." : "Submit Proof"}
                </button>
                {message && <div className="reports-message">{message}</div>}
              </div>
            </form>
          </div>
        )}

        {activeTab === "list" && (
          <div className="page-card">
            <h2>{isOwner ? "Owner Dashboard - Reports" : "My Daily Submissions"}</h2>

            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Issues</th>
                  <th>Proof</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {(listToShow || []).map((r) => (
                  <tr key={r.id}>
                    <td>{r.reportDate}</td>
                    <td>{r.user?.name || r.user?.email || r.user?.id}</td>
                    <td>{r.completedWork}</td>
                    <td>{r.pendingWork}</td>
                    <td>{r.issues}</td>
                    <td>{r.proofFilePath ? <span>{r.proofFileName || "Proof"}</span> : "-"}</td>
                    <td>
                      {r.latitude && r.longitude ? (
                        <span>
                          {r.latitude}, {r.longitude}
                          {r.locationAddress ? <div>{r.locationAddress}</div> : null}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}

                {(listToShow || []).length === 0 && (
                  <tr>
                    <td colSpan={7}>No submissions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Reports;

