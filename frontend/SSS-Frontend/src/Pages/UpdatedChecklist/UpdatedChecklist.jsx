import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import axiosClient from "../../api/axiosClient";
import "./UpdatedChecklist.css";
import {
  FaEye,
  FaSearch,
  FaPrint,
  FaFileExcel,
  FaFilePdf,
  FaTimes,
  FaClipboardList,
  FaChartBar,
  FaSyncAlt,
} from "react-icons/fa";

const API_BASE = "http://localhost:8080";

function UpdatedChecklist() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const [activeTab, setActiveTab] = useState("updated");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterSupervisor, setFilterSupervisor] = useState("");

  // View modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRows, setViewRows] = useState([]);
  const [viewInfo, setViewInfo] = useState({});

  // Owner Reports tab
  const [reportType, setReportType] = useState("daily");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportRows, setReportRows] = useState([]);

  const isOwnerOrDirector = useMemo(() => {
    const role = String(user?.roleName || user?.role?.roleName || "").toUpperCase();
    return role === "DIRECTOR" || role === "OWNER/ADMIN" || role === "OWNER";
  }, [user]);

  // ========== LOAD ALL SUBMISSIONS ==========
  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/api/checklist-report/all-submissions");
      const data = res.data;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Load submissions error:", e);
      setError("Failed to load submissions. Please check backend.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    if (activeTab === "updated") loadSubmissions();
  }, [activeTab, loadSubmissions]);

  // Auto-refresh: poll the backend every few seconds so newly saved checklists
  // appear in the Director "Updated Checklist" section WITHOUT a manual refresh.
  useEffect(() => {
    if (activeTab !== "updated") return;
    loadSubmissions();
    const interval = setInterval(() => {
      loadSubmissions();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab, loadSubmissions]);

  // ========== DERIVE FILTER OPTIONS ==========
  const siteOptions = useMemo(() => {
    const set = new Set(submissions.map((s) => s.siteName || s.siteCode || "Unknown").filter(Boolean));
    return [...set];
  }, [submissions]);

  const supervisorOptions = useMemo(() => {
    const set = new Set(submissions.map((s) => s.supervisor?.name || "Unknown").filter(Boolean));
    return [...set];
  }, [submissions]);

  // ========== GROUP SUBMISSIONS ==========
  const grouped = useMemo(() => {
    const map = new Map();
    submissions.forEach((r) => {
      const key = `${r.sheetName}|${r.reportDate}|${r.siteName || r.siteCode}|${r.supervisor?.id || "anon"}`;
      if (!map.has(key)) {
        map.set(key, {
          date: r.reportDate,
          site: r.siteName || r.siteCode || "Unknown",
          supervisor: r.supervisor?.name || "Unknown",
          sheetName: r.sheetName || "Checklist",
          shift: r.shift || "-",
          rows: [],
          totalEmployees: 0,
          completedTasks: 0,
          status: "Completed",
          id: r.id,
        });
      }
      const group = map.get(key);
      group.rows.push(r);
      if (r.employeeName) {
        const empNames = new Set(group.rows.map((x) => x.employeeName).filter(Boolean));
        group.totalEmployees = empNames.size;
      }
      if (String(r.status || "").toUpperCase() === "YES") group.completedTasks++;
    });

    let list = [...map.values()];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        (g.site || "").toLowerCase().includes(q) ||
        (g.supervisor || "").toLowerCase().includes(q) ||
        (g.sheetName || "").toLowerCase().includes(q) ||
        (g.date || "").includes(q)
      );
    }
    if (filterDate) list = list.filter((g) => g.date === filterDate);
    if (filterSite) list = list.filter((g) => g.site === filterSite);
    if (filterSupervisor) list = list.filter((g) => g.supervisor === filterSupervisor);

    list.sort((a, b) => (a.date < b.date ? 1 : -1));
    return list;
  }, [submissions, search, filterDate, filterSite, filterSupervisor]);

  // ========== OPEN VIEW ==========
  const openView = (group) => {
    setViewOpen(true);
    setViewInfo(group);
    setViewRows(group.rows || []);
  };

  // ========== OWNER REPORTS ==========
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/api/checklist-report/all-submissions");
      const data = res.data || [];

      let filtered = data;
      if (reportType === "daily") {
        filtered = data.filter((r) => r.reportDate === reportDate);
      } else if (reportType === "weekly") {
        const target = new Date(reportDate);
        const start = new Date(target);
        start.setDate(target.getDate() - 6);
        filtered = data.filter((r) => {
          if (!r.reportDate) return false;
          const d = new Date(r.reportDate);
          return d >= start && d <= target;
        });
      } else if (reportType === "monthly") {
        const [y, m] = reportDate.split("-").map(Number);
        filtered = data.filter((r) => {
          if (!r.reportDate) return false;
          const [ry, rm] = r.reportDate.split("-").map(Number);
          return ry === y && rm === m;
        });
      }
      setReportRows(filtered);
    } catch (e) {
      console.error("Load report error:", e);
      setError("Failed to load reports.");
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  }, [reportType, reportDate]);

  useEffect(() => {
    if (activeTab === "reports") loadReport();
  }, [activeTab, reportType, reportDate, loadReport]);

  // ========== PRINT ==========
  const printReport = () => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Checklist Report - ${reportType}</title>
      <style>
        body{font-family:Arial;padding:20px;}h1{color:#5b2bd8;text-align:center;}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;}
        th,td{border:1px solid #ccc;padding:5px;text-align:center;}
        th{background:#5b2bd8;color:white;}
        .bg-section{background:#f6f0ff;font-weight:700;}
      </style></head><body>
      <h1>SSS FACILITY SERVICES</h1>
      <h2>${reportType.toUpperCase()} REPORT</h2>
      <p>Date: ${reportDate}</p>
      <table><thead><tr>
        <th>Sr</th><th>Date</th><th>Site</th><th>Sheet</th><th>Supervisor</th>
        <th>Task</th><th>Status</th><th>Remark</th><th>Employee</th><th>In</th><th>Out</th><th>Location</th>
      </tr></thead><tbody>
      ${reportRows.map((r, i) => `<tr>
        <td>${i + 1}</td>
        <td>${r.reportDate || "-"}</td>
        <td>${r.siteName || r.siteCode || "-"}</td>
        <td>${r.sheetName || "-"}</td>
        <td>${r.supervisor?.name || "-"}</td>
        <td style="text-align:left">${r.taskName || "-"}</td>
        <td>${r.status || "Pending"}</td>
        <td>${r.remark || "-"}</td>
        <td>${r.employeeName || "-"}</td>
        <td>${r.timeIn || "-"}</td>
        <td>${r.timeOut || "-"}</td>
        <td>${r.locationAddress || (r.latitude ? r.latitude + "," + r.longitude : "-")}</td>
      </tr>`).join("")}
      </tbody></table></body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  // ========== EXPORT EXCEL ==========
  const exportExcel = () => {
    const headers = "Date,Site,Sheet,Supervisor,Task,Status,Remark,Employee,Time In,Time Out,Location\n";
    let csv = headers;
    reportRows.forEach((r) => {
      csv += `"${r.reportDate||"-"}","${r.siteName||r.siteCode||"-"}","${r.sheetName||"-"}","${r.supervisor?.name||"-"}","${r.taskName||"-"}","${r.status||"Pending"}","${r.remark||"-"}","${r.employeeName||"-"}","${r.timeIn||"-"}","${r.timeOut||"-"}","${r.locationAddress||(r.latitude?r.latitude+","+r.longitude:"-")}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report-${reportDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== RENDER VIEW TABLE ==========
  const renderViewTable = () => (
    <div className="excel-view-table-wrapper">
      <table className="excel-view-table">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Section</th>
            <th>Check Point / Task</th>
            <th>Freq.</th>
            <th>Employee</th>
            <th>Status</th>
            <th>Remark</th>
            <th>Completed By</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Photo</th>
            <th>Location</th>
            <th>Updated By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {viewRows.map((r, i) => (
            <tr key={r.id || i}>
              <td>{i + 1}</td>
              <td className="bg-section">{r.sectionName || "-"}</td>
              <td className="task-text">{r.taskName || "-"}</td>
              <td>{r.frequency || "Daily"}</td>
              <td>{r.employeeName || "-"}</td>
              <td><span className={`status-badge ${(r.status || "pending").toLowerCase()}`}>{r.status || "Pending"}</span></td>
              <td>{r.remark || "-"}</td>
              <td>{r.completedBy || "-"}</td>
              <td>{r.timeIn || "-"}</td>
              <td>{r.timeOut || "-"}</td>
              <td>
                {r.photoName ? (
                  <a href={`${API_BASE}/uploads/checklist/${r.photoName}`} target="_blank" rel="noreferrer" className="photo-view-link">
                    📷 View
                  </a>
                ) : "-"}
              </td>
              <td>
                {r.locationAddress ? (
                  <span>
                    {r.locationAddress.split(",")[0]}
                    {r.latitude && (
                      <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="map-link"> Map</a>
                    )}
                  </span>
                ) : r.latitude ? `${r.latitude},${r.longitude}` : "-"}
              </td>
              <td>{r.updatedBy || r.supervisor?.name || "-"}</td>
              <td>{r.reportDate || "-"}</td>
            </tr>
          ))}
          {viewRows.length === 0 && (
            <tr><td colSpan="14" className="loading-text">No rows found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout title="Updated Checklist">
      <div className="updated-checklist-wrapper">
        {/* Tabs */}
        <div className="updated-checklist-tabs">
          <button className={`updated-tab-btn ${activeTab === "updated" ? "active" : ""}`} onClick={() => setActiveTab("updated")}>
            <FaClipboardList /> Updated Checklist
          </button>
          {isOwnerOrDirector && (
            <button className={`updated-tab-btn ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
              <FaChartBar /> Owner Reports
            </button>
          )}
          <button className="updated-tab-btn refresh" onClick={() => {
            if (activeTab === "updated") loadSubmissions();
            else loadReport();
          }}>
            <FaSyncAlt /> Refresh
          </button>
        </div>

        {error && <div className="updated-error-message">{error}</div>}

        {/* TAB 1: UPDATED CHECKLIST */}
        {activeTab === "updated" && (
          <div className="updated-checklist-sheet">
            <div className="updated-filters">
              <div className="updated-search-box">
                <FaSearch className="updated-search-icon" />
                <input
                  placeholder="Search site, supervisor, sheet, date..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} title="Filter by Date" />
              <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} title="Filter by Site">
                <option value="">All Sites</option>
                {siteOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)} title="Filter by Supervisor">
                <option value="">All Supervisors</option>
                {supervisorOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="filter-clear-btn" onClick={() => { setSearch(""); setFilterDate(""); setFilterSite(""); setFilterSupervisor(""); }}>
                Clear
              </button>
            </div>

            {loading ? (
              <p className="loading-text">Loading submissions...</p>
            ) : grouped.length === 0 ? (
              <p className="loading-text">No submitted checklists found.</p>
            ) : (
              <div className="updated-table-wrapper">
                <table className="updated-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Site</th>
                      <th>Supervisor</th>
                      <th>Sheet</th>
                      <th>Shift</th>
                      <th>Status</th>
                      <th>Total Employees</th>
                      <th>Completed Tasks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((g) => (
                      <tr key={g.id}>
                        <td>{g.date}</td>
                        <td>{g.site}</td>
                        <td>{g.supervisor}</td>
                        <td>{g.sheetName}</td>
                        <td>{g.shift}</td>
                        <td><span className="status-badge completed">{g.status}</span></td>
                        <td>{g.totalEmployees}</td>
                        <td>{g.completedTasks}</td>
                        <td>
                          <button className="view-btn" onClick={() => openView(g)}><FaEye /> View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OWNER REPORTS */}
        {activeTab === "reports" && isOwnerOrDirector && (
          <div className="updated-checklist-sheet">
            <div className="report-controls">
              <div className="report-type-buttons">
                <button className={`report-type-btn ${reportType === "daily" ? "active" : ""}`} onClick={() => setReportType("daily")}>Daily</button>
                <button className={`report-type-btn ${reportType === "weekly" ? "active" : ""}`} onClick={() => setReportType("weekly")}>Weekly</button>
                <button className={`report-type-btn ${reportType === "monthly" ? "active" : ""}`} onClick={() => setReportType("monthly")}>Monthly</button>
              </div>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              <div className="report-export-buttons">
                <button className="report-print-btn" onClick={printReport}><FaPrint /> Print</button>
                <button className="report-excel-btn" onClick={exportExcel}><FaFileExcel /> Export Excel</button>
                <button className="report-pdf-btn" onClick={printReport}><FaFilePdf /> Export PDF</button>
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading report...</p>
            ) : reportRows.length === 0 ? (
              <p className="loading-text">No data found for the selected period.</p>
            ) : (
              <div className="updated-table-wrapper">
                <table className="updated-table report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Site</th>
                      <th>Supervisor</th>
                      <th>Sheet</th>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Remark</th>
                      <th>Employee</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((r, i) => (
                      <tr key={r.id || i}>
                        <td>{r.reportDate || "-"}</td>
                        <td>{r.siteName || r.siteCode || "-"}</td>
                        <td>{r.supervisor?.name || "-"}</td>
                        <td>{r.sheetName || "-"}</td>
                        <td className="task-text">{r.taskName || "-"}</td>
                        <td><span className={`status-badge ${(r.status || "pending").toLowerCase()}`}>{r.status || "Pending"}</span></td>
                        <td>{r.remark || "-"}</td>
                        <td>{r.employeeName || "-"}</td>
                        <td>{r.timeIn || "-"}</td>
                        <td>{r.timeOut || "-"}</td>
                        <td>{r.locationAddress ? r.locationAddress.split(",")[0] : (r.latitude ? `${r.latitude},${r.longitude}` : "-")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewOpen && (
        <div className="updated-view-overlay" onClick={() => setViewOpen(false)}>
          <div className="updated-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="updated-view-header">
              <div>
                <h2>SSS FACILITY SERVICES</h2>
                <p>{viewInfo.sheetName} | Date: {viewInfo.date} | Site: {viewInfo.site} | Supervisor: {viewInfo.supervisor}</p>
              </div>
              <button className="updated-view-close" onClick={() => setViewOpen(false)}><FaTimes /></button>
            </div>
            <div className="updated-view-body">
              {renderViewTable()}
              <div className="view-modal-actions">
                <button className="report-print-btn" onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(`
                    <html><head><title>${viewInfo.sheetName} - ${viewInfo.date}</title>
                    <style>
                      body{font-family:Arial;padding:20px;}h1{color:#5b2bd8;text-align:center;}
                      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;}
                      th,td{border:1px solid #ccc;padding:5px;text-align:center;}
                      th{background:#5b2bd8;color:white;}.bg-section{background:#f6f0ff;font-weight:700;}
                    </style></head><body>
                    <h1>SSS FACILITY SERVICES</h1>
                    <h2>${viewInfo.sheetName}</h2>
                    <p>Date: ${viewInfo.date} | Site: ${viewInfo.site} | Supervisor: ${viewInfo.supervisor}</p>
                    <table><thead><tr>
                      <th>Sr</th><th>Section</th><th>Task</th><th>Freq.</th><th>Employee</th>
                      <th>Status</th><th>Remark</th><th>Completed By</th><th>In</th><th>Out</th><th>Location</th><th>Updated By</th>
                    </tr></thead><tbody>
                    ${viewRows.map((r, i) => `<tr>
                      <td>${i + 1}</td>
                      <td class="bg-section">${r.sectionName || "-"}</td>
                      <td style="text-align:left">${r.taskName || "-"}</td>
                      <td>${r.frequency || "Daily"}</td>
                      <td>${r.employeeName || "-"}</td>
                      <td>${r.status || "Pending"}</td>
                      <td>${r.remark || "-"}</td>
                      <td>${r.completedBy || "-"}</td>
                      <td>${r.timeIn || "-"}</td>
                      <td>${r.timeOut || "-"}</td>
                      <td>${r.locationAddress || (r.latitude ? r.latitude + "," + r.longitude : "-")}</td>
                      <td>${r.updatedBy || r.supervisor?.name || "-"}</td>
                    </tr>`).join("")}
                    </tbody></table></body></html>
                  `);
                  w.document.close();
                  w.focus();
                  w.print();
                }}><FaPrint /> Print</button>
                <button className="report-excel-btn" onClick={() => {
                  let csv = "Sr,Section,Task,Frequency,Employee,Status,Remark,Completed By,Time In,Time Out,Location,Updated By\n";
                  viewRows.forEach((r, i) => {
                    csv += `"${i+1}","${r.sectionName||"-"}","${r.taskName||"-"}","${r.frequency||"Daily"}","${r.employeeName||"-"}","${r.status||"Pending"}","${r.remark||"-"}","${r.completedBy||"-"}","${r.timeIn||"-"}","${r.timeOut||"-"}","${r.locationAddress||"-"}","${r.updatedBy||r.supervisor?.name||"-"}"\n`;
                  });
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${viewInfo.sheetName}-${viewInfo.date}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}><FaFileExcel /> Export Excel</button>
                <button className="report-pdf-btn" onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(`
                    <html><head><title>${viewInfo.sheetName} - ${viewInfo.date}</title>
                    <style>
                      body{font-family:Arial;padding:20px;}h1{color:#5b2bd8;text-align:center;}
                      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:11px;}
                      th,td{border:1px solid #ccc;padding:5px;text-align:center;}
                      th{background:#5b2bd8;color:white;}.bg-section{background:#f6f0ff;font-weight:700;}
                    </style></head><body>
                    <h1>SSS FACILITY SERVICES</h1>
                    <h2>${viewInfo.sheetName}</h2>
                    <p>Date: ${viewInfo.date} | Site: ${viewInfo.site} | Supervisor: ${viewInfo.supervisor}</p>
                    <table><thead><tr>
                      <th>Sr</th><th>Section</th><th>Task</th><th>Freq.</th><th>Employee</th>
                      <th>Status</th><th>Remark</th><th>Completed By</th><th>In</th><th>Out</th><th>Location</th><th>Updated By</th>
                    </tr></thead><tbody>
                    ${viewRows.map((r, i) => `<tr>
                      <td>${i + 1}</td>
                      <td class="bg-section">${r.sectionName || "-"}</td>
                      <td style="text-align:left">${r.taskName || "-"}</td>
                      <td>${r.frequency || "Daily"}</td>
                      <td>${r.employeeName || "-"}</td>
                      <td>${r.status || "Pending"}</td>
                      <td>${r.remark || "-"}</td>
                      <td>${r.completedBy || "-"}</td>
                      <td>${r.timeIn || "-"}</td>
                      <td>${r.timeOut || "-"}</td>
                      <td>${r.locationAddress || (r.latitude ? r.latitude + "," + r.longitude : "-")}</td>
                      <td>${r.updatedBy || r.supervisor?.name || "-"}</td>
                    </tr>`).join("")}
                    </tbody></table></body></html>
                  `);
                  w.document.close();
                  w.focus();
                  w.print();
                }}><FaFilePdf /> Export PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default UpdatedChecklist;
