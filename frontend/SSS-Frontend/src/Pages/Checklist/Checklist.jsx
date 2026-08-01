import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./Checklist.css";
import {
  FaEdit,
  FaTrash,
  FaPrint,
  FaSave,
  FaEye,
  FaDownload,
  FaCamera,
  FaMapMarkerAlt,
  FaHistory,
  FaClipboardList,
  FaTimes,
  FaSyncAlt,
  FaPlus,
  FaColumns,
} from "react-icons/fa";

const API_BASE = "http://localhost:8080";

// Excel-like minimum rows always displayed
const MIN_ROWS = 30;

// Default columns for the existing SSS Facility checklist
const DEFAULT_COLUMNS = [
  { key: "sr", label: "Sr.", type: "sr", locked: true },
  { key: "section", label: "Section", type: "text" },
  { key: "task", label: "Check Point / Task", type: "text" },
  { key: "freq", label: "Freq.", type: "text" },
  { key: "employee", label: "Employee Name", type: "employee" },
  { key: "status", label: "Status", type: "status" },
  { key: "remark", label: "Remark", type: "text" },
  { key: "completedBy", label: "Completed By", type: "text" },
  { key: "timeIn", label: "Time In", type: "time" },
  { key: "timeOut", label: "Time Out", type: "time" },
  { key: "photo", label: "Photo", type: "photo" },
  { key: "location", label: "Location", type: "location" },
  { key: "updatedBy", label: "Updated By", type: "text", readonly: true },
  { key: "date", label: "Date", type: "date", readonly: true },
  { key: "action", label: "Action", type: "action", locked: true },
];

// Ensure sr column is always first and action column is always last
const sanitizeColumns = (cols) => {
  const arr = Array.isArray(cols) ? cols.filter((c) => c && c.key) : [];
  if (!arr.some((c) => c.key === "sr")) {
    arr.unshift({ key: "sr", label: "Sr.", type: "sr", locked: true });
  }
  if (!arr.some((c) => c.key === "action")) {
    arr.push({ key: "action", label: "Action", type: "action", locked: true });
  }
  return arr;
};

function Checklist() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [checklist, setChecklist] = useState([]);
  const [sheetName, setSheetName] = useState("Daily Checklist");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);

  const [siteInfo, setSiteInfo] = useState({
    siteName: "Purvankra",
    building: "Silver Park - Tower A",
    location: "Silver Park Society, Pune",
    month: "July - 2026",
    date: new Date().toISOString().split("T")[0],
    supervisor: user.name || "Supervisor",
    shift: "Morning",
    reviewer: "Facility Manager",
  });

  // entries: { [rowKey]: { status, remark, employeeName, completedBy, timeIn, timeOut, photo, photoPreview, latitude, longitude, locationAddress, photoName, photoPath, sectionName, taskName, frequency, updatedBy, savedReportId, extra } }
  const [entries, setEntries] = useState({});

  // Custom rows added by supervisor (extra rows below master rows)
  const [customRows, setCustomRows] = useState([]);

  // Employees for the Employee dropdown (site team first, then all)
  const [employees, setEmployees] = useState([]);

  // Saved reports history
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("checklist");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  // Audit modal state
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditRows, setAuditRows] = useState([]);
  const [auditReportId, setAuditReportId] = useState(null);

// Column builder state
  const [columnBuilderOpen, setColumnBuilderOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [renamingColKey, setRenamingColKey] = useState(null);
  const [renamingColValue, setRenamingColValue] = useState("");

  // Sheet names from DB
  const [sheetNames, setSheetNames] = useState([]);

  // Hidden file input refs per row / per custom photo column
  const fileInputsRef = useRef({});
  const extraFileInputsRef = useRef({});

  // ========== FETCH EMPLOYEES (site team first) ==========
  const loadEmployees = useCallback(async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) return;
      const headers = { "X-User-Id": String(loggedInUser.id) };
      let data = null;
      try {
        const res = await fetch(`${API_BASE}/api/users/my-site-team`, { headers });
        if (res.ok) data = await res.json();
      } catch (e) {
        // fall through to all users
      }
      if (!Array.isArray(data)) {
        const res = await fetch(`${API_BASE}/api/users`, { headers });
        data = await res.json();
      }
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Load employees error:", e);
      setEmployees([]);
    }
  }, []);

useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ========== LOAD SHEET NAMES FROM DB ==========
  const loadSheetNames = useCallback(async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) return;
      const res = await fetch(`${API_BASE}/api/checklist-master/sheets`, {
        headers: { "X-User-Id": String(loggedInUser.id) },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSheetNames(data);
        }
      }
    } catch (e) {
      console.log("Load sheet names error:", e);
    }
  }, []);

  useEffect(() => {
    loadSheetNames();
  }, [loadSheetNames]);

  // ========== REVERSE GEOCODE ==========
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data && data.display_name) return data.display_name;
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // ========== GET LOCATION FOR A SPECIFIC ROW ==========
  const getLocationForRow = async (id) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        updateEntry(id, "latitude", String(latitude));
        updateEntry(id, "longitude", String(longitude));
        updateEntry(id, "locationAddress", address);
        setLocationLoading(false);
      },
      (err) => {
        alert("Location error: " + err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ========== GET LOCATION FOR A CUSTOM COLUMN CELL ==========
  const getExtraLocationForRow = async (id, colKey) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        onExtraCellEdit(id, colKey, { latitude: String(latitude), longitude: String(longitude), locationAddress: address });
        setLocationLoading(false);
      },
      (err) => {
        alert("Location error: " + err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ========== LOAD CHECKLIST MASTER ==========
  const loadChecklist = useCallback(async (sheet) => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) { setChecklist([]); return; }

      const response = await fetch(
        `${API_BASE}/api/checklist-master/sheet?sheetName=${encodeURIComponent(sheet)}`,
        { headers: { "X-User-Id": String(loggedInUser.id) } }
      );
      const text = await response.text();
      let data = [];
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = [];
      }
      setChecklist(Array.isArray(data) ? data : []);
      // Reset entries + custom rows + columns when sheet changes
      setEntries({});
      setCustomRows([]);
      setColumns(DEFAULT_COLUMNS);
    } catch (error) {
      console.log(error);
      setChecklist([]);
      setEntries({});
      setCustomRows([]);
      setColumns(DEFAULT_COLUMNS);
    }
  }, []);

  // ========== LOAD SAVED MASTER COLUMN LAYOUT ==========
  const loadMasterLayout = useCallback(async (sheet, date) => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) return;
      const res = await fetch(
        `${API_BASE}/api/checklist-sheet/master?sheetName=${encodeURIComponent(sheet)}&date=${date}`,
        { headers: { "X-User-Id": String(loggedInUser.id) } }
      );
      const data = await res.json();
      if (data && data.found && data.columnsJson) {
        let savedCols = null;
        try { savedCols = JSON.parse(data.columnsJson); } catch (e) { savedCols = null; }
        if (Array.isArray(savedCols) && savedCols.length > 0) {
          setColumns(sanitizeColumns(savedCols));
          return;
        }
      }
      setColumns(DEFAULT_COLUMNS);
    } catch (e) {
      console.log("Load master layout error:", e);
      setColumns(DEFAULT_COLUMNS);
    }
  }, []);

  // ========== LOAD PREVIOUSLY SAVED DATA FOR THIS DATE+SHEET ==========
  const loadSavedEntries = useCallback(async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id || !siteInfo.date) return;

      const response = await fetch(
        `${API_BASE}/api/checklist-report/my-submissions/date?date=${siteInfo.date}&sheetName=${encodeURIComponent(sheetName)}`,
        { headers: { "X-User-Id": String(loggedInUser.id) } }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return;

      const restored = {};
      const customReports = [];
      data.forEach((report) => {
        const key = report.checklistMasterId ? String(report.checklistMasterId) : `custom-${report.id}`;
        let extra = {};
        try { extra = report.extraJson ? JSON.parse(report.extraJson) : {}; } catch (e) { extra = {}; }
        restored[key] = {
          status: report.status || "Pending",
          remark: report.remark || "",
          employeeName: report.employeeName || "",
          completedBy: report.completedBy || "",
          timeIn: report.timeIn || "",
          timeOut: report.timeOut || "",
          photoName: report.photoName || "",
          photoPath: report.photoPath || "",
          latitude: report.latitude ? String(report.latitude) : "",
          longitude: report.longitude ? String(report.longitude) : "",
          locationAddress: report.locationAddress || "",
          sectionName: report.sectionName || "",
          taskName: report.taskName || "",
          frequency: report.frequency || "",
          updatedBy: report.updatedBy || "",
          savedReportId: report.id,
          extra,
        };
        if (!report.checklistMasterId) {
          customReports.push({
            uid: `custom-${report.id}`,
            sectionName: report.sectionName || "",
            checkPoint: report.taskName || "",
            frequency: report.frequency || "",
          });
        }
      });
      setEntries((prev) => ({ ...prev, ...restored }));

      if (customReports.length > 0) {
        setCustomRows((prev) => {
          const existingUids = new Set(prev.map((r) => r.uid));
          const newRows = customReports.filter((r) => !existingUids.has(r.uid));
          return [...prev, ...newRows];
        });
      }
    } catch (error) {
      console.log("Load saved entries error:", error);
    }
  }, [siteInfo.date, sheetName]);

  useEffect(() => {
    loadChecklist(sheetName);
  }, [sheetName, loadChecklist]);

  // Load saved master layout when sheet or date changes
  useEffect(() => {
    if (siteInfo.date && sheetName) {
      loadMasterLayout(sheetName, siteInfo.date);
    }
  }, [sheetName, siteInfo.date, loadMasterLayout]);

  // When checklist loads or date/sheet changes, try to load saved data
  useEffect(() => {
    if (checklist.length > 0) {
      loadSavedEntries();
    }
  }, [checklist.length, siteInfo.date, sheetName, loadSavedEntries]);

  useEffect(() => {
    if (activeTab === "history") loadSavedReports();
  }, [activeTab]);

  // ========== ENTRY UPDATES ==========
  const updateEntry = (id, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, updatedBy: user.name || "Supervisor" },
    }));
  };

  const getEntry = (id) => entries[id] || {};
  const getStatus = (id) => getEntry(id).status || "Pending";

  // ========== ROW LIST (master + custom + empty placeholders, Excel-like) ==========
  const buildRowList = () => {
    const master = checklist.map((item) => ({
      key: `m-${item.id}`,
      uid: String(item.id),
      type: "master",
      item,
    }));
    const custom = customRows.map((r) => ({
      key: r.uid,
      uid: r.uid,
      type: "custom",
      item: r,
    }));
    const total = master.length + custom.length;
    const empties = [];
    for (let i = total; i < MIN_ROWS; i++) {
      empties.push({ key: `empty-${i}`, uid: `empty-${i}`, type: "empty", item: null });
    }
    return [...master, ...custom, ...empties];
  };

  // ========== ADD / DELETE ROW ==========
  const addCustomRow = () => {
    const uid = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCustomRows((prev) => [...prev, { uid, sectionName: "", checkPoint: "", frequency: "" }]);
    setEntries((prev) => ({
      ...prev,
      [uid]: { status: "Pending", sectionName: "", taskName: "", frequency: "", extra: {} },
    }));
  };

  const deleteRow = (uid) => {
    if (uid.startsWith("custom-")) {
      setCustomRows((prev) => prev.filter((r) => r.uid !== uid));
      setEntries((prev) => {
        const { [uid]: _drop, ...rest } = prev;
        return rest;
      });
    } else {
      setEntries((prev) => {
        const { [uid]: _drop, ...rest } = prev;
        return rest;
      });
    }
  };

  // Typing into an empty placeholder converts it to a custom row (Excel-like)
  const onCellEdit = (uid, field, value) => {
    if (uid.startsWith("empty-")) {
      const newUid = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCustomRows((prev) => [...prev, { uid: newUid, sectionName: "", checkPoint: "", frequency: "" }]);
      setEntries((prev) => ({
        ...prev,
        [newUid]: { ...(prev[uid] || {}), [field]: value, extra: { ...(prev[uid]?.extra || {}) }, updatedBy: user.name || "Supervisor" },
      }));
    } else {
      updateEntry(uid, field, value);
    }
  };

  // Edit a custom (user-added) column cell value
  const onExtraCellEdit = (uid, colKey, value) => {
    if (uid.startsWith("empty-")) {
      const newUid = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCustomRows((prev) => [...prev, { uid: newUid, sectionName: "", checkPoint: "", frequency: "" }]);
      setEntries((prev) => ({
        ...prev,
        [newUid]: {
          ...(prev[uid] || {}),
          extra: { ...(prev[uid]?.extra || {}), [colKey]: value },
          updatedBy: user.name || "Supervisor",
        },
      }));
    } else {
      setEntries((prev) => ({
        ...prev,
        [uid]: { ...prev[uid], extra: { ...(prev[uid]?.extra || {}), [colKey]: value }, updatedBy: user.name || "Supervisor" },
      }));
    }
  };

  // ========== COLUMN MANAGEMENT ==========
  const renameColumn = (key, label) => {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, label } : c)));
  };

  const removeColumn = (key) => {
    setColumns((prev) => prev.filter((c) => c.key !== key));
  };

  const addColumn = () => {
    const label = (newColLabel || "New Column").trim();
    const key = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newCol = { key, label, type: newColType };
    setColumns((prev) => {
      const action = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      return [...rest, newCol, action];
    });
    setNewColLabel("");
    setColumnBuilderOpen(false);
  };

// ========== PHOTO HANDLING PER ROW (upload to backend + GPS) ==========
  const handleRowPhoto = async (uid, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateEntry(uid, "photoPreview", ev.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("file", file);
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API_BASE}/api/checklist-report/photo`, {
        method: "POST",
        headers: { "X-User-Id": String(loggedInUser?.id || "") },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        updateEntry(uid, "photoName", data.photoName);
        updateEntry(uid, "photoPath", data.photoPath);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    }

    // Also capture GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          updateEntry(uid, "latitude", String(latitude));
          updateEntry(uid, "longitude", String(longitude));
          updateEntry(uid, "locationAddress", address);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const removeRowPhoto = (uid) => {
    setEntries((prev) => ({
      ...prev,
      [uid]: { ...prev[uid], photoPreview: undefined, photoName: "", photoPath: "" },
    }));
  };

  // ========== SAVE CHECKLIST ==========
  const handleSave = async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) { alert("Login required"); return; }

      const entriesList = [];
      rowList.forEach((row) => {
        if (row.type === "empty") return;
        const entry = getEntry(row.uid);
        const masterId = row.type === "master" ? row.item.id : null;
        entriesList.push({
          checklistMasterId: masterId,
          siteCode: siteInfo.siteName || "",
          siteName: siteInfo.siteName || "",
          sheetName: sheetName,
          shift: siteInfo.shift || "",
          employeeName: entry.employeeName || "",
          completedBy: entry.completedBy || "",
          timeIn: entry.timeIn || "",
          timeOut: entry.timeOut || "",
          sectionName: entry.sectionName || (row.item && row.item.sectionName) || "",
          frequency: entry.frequency || (row.item && row.item.frequency) || "",
          taskName: entry.taskName || (row.item && row.item.checkPoint) || "",
          status: entry.status || "Pending",
          remark: entry.remark || "",
          reportDate: siteInfo.date,
          updatedBy: user.name || "Supervisor",
          latitude: entry.latitude || "",
          longitude: entry.longitude || "",
          locationAddress: entry.locationAddress || "",
          photoName: entry.photoName || "",
          photoPath: entry.photoPath || "",
          extraJson: entry.extra ? JSON.stringify(entry.extra) : (entry.extraJson || "{}"),
        });
      });

      const res = await fetch(`${API_BASE}/api/checklist-report/batch-save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(loggedInUser.id),
        },
        body: JSON.stringify(entriesList),
      });

      if (res.ok) {
        // Also save the column layout as MASTER
        try {
          const layoutPayload = {
            kind: "MASTER",
            sheetName: sheetName,
            columnsJson: JSON.stringify(columns),
            rowsJson: "[]",
            siteName: siteInfo.siteName || "",
            reportDate: siteInfo.date,
          };
          await fetch(`${API_BASE}/api/checklist-sheet/save`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": String(loggedInUser.id),
            },
            body: JSON.stringify(layoutPayload),
          });
        } catch (layoutErr) {
          console.log("Layout save error (non-critical):", layoutErr);
        }

        alert("Checklist saved successfully!");
        loadSavedEntries();
      } else {
        alert("Failed to save checklist");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving checklist");
    }
  };

  // ========== PRINT ==========
  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>${sheetName}</title>
      <style>
        body{font-family:Arial;padding:20px;}
        h1{color:#5b2bd8;text-align:center;}
        h2{text-align:center;color:#111827;}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px;}
        th,td{border:1px solid #ccc;padding:4px;text-align:center;}
        th{background:#5b2bd8;color:white;}
        .bg-section{background:#f6f0ff;font-weight:700;}
        .task-text{text-align:left;}
      </style></head><body>
      <h1>SSS FACILITY SERVICES</h1>
      <h2>${sheetName.toUpperCase()}</h2>
      <p><b>Site:</b> ${siteInfo.siteName} | <b>Building:</b> ${siteInfo.building} | <b>Date:</b> ${siteInfo.date} | <b>Shift:</b> ${siteInfo.shift}</p>
      <table>
        <thead><tr>
          <th>Sr.No</th><th>Section</th><th>Task</th><th>Frequency</th>
          <th>Employee</th><th>Status</th><th>Remark</th><th>Completed By</th>
          <th>Time In</th><th>Time Out</th><th>Updated By</th><th>Date</th><th>Location</th>
        </tr></thead>
        <tbody>
    `);
    buildRowList().forEach((row, i) => {
      const e = getEntry(row.uid);
      const section = e.sectionName || (row.item && row.item.sectionName) || "-";
      const task = e.taskName || (row.item && row.item.checkPoint) || "-";
      const freq = e.frequency || (row.item && row.item.frequency) || "Daily";
      const isBlank = row.type === "empty" && !(e && (e.remark || e.employeeName || e.status !== "Pending"));
      if (isBlank) return;
      w.document.write(`<tr>
        <td>${i + 1}</td>
        <td class="bg-section">${section}</td>
        <td style="text-align:left">${task}</td>
        <td>${freq}</td>
        <td>${e.employeeName || "-"}</td>
        <td>${e.status || "Pending"}</td>
        <td>${e.remark || "-"}</td>
        <td>${e.completedBy || "-"}</td>
        <td>${e.timeIn || "-"}</td>
        <td>${e.timeOut || "-"}</td>
        <td>${e.updatedBy || "-"}</td>
        <td>${siteInfo.date}</td>
        <td>${e.locationAddress || (e.latitude ? `${e.latitude}, ${e.longitude}` : "-")}</td>
      </tr>`);
    });
    w.document.write(`</tbody></table></body></html>`);
    w.document.close();
  };

  // ========== PREVIEW ==========
  const handlePreview = () => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Preview - ${sheetName}</title>
      <style>
        body{font-family:Arial;padding:20px;}
        h1{color:#5b2bd8;text-align:center;}
        h2{text-align:center;color:#111827;}
        table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px;}
        th,td{border:1px solid #ccc;padding:4px;text-align:center;}
        th{background:#5b2bd8;color:white;}
        .bg-section{background:#f6f0ff;font-weight:700;}
        .task-text{text-align:left;}
      </style></head><body>
      <h1>SSS FACILITY SERVICES</h1>
      <h2>${sheetName.toUpperCase()} - PREVIEW</h2>
      <p><b>Site:</b> ${siteInfo.siteName} | <b>Building:</b> ${siteInfo.building} | <b>Date:</b> ${siteInfo.date} | <b>Shift:</b> ${siteInfo.shift}</p>
      <table>
        <thead><tr>
          <th>Sr.No</th><th>Section</th><th>Task</th><th>Frequency</th>
          <th>Employee</th><th>Status</th><th>Remark</th><th>Completed By</th>
          <th>Time In</th><th>Time Out</th><th>Updated By</th><th>Date</th><th>Location</th>
        </tr></thead>
        <tbody>
    `);
    buildRowList().forEach((row, i) => {
      const e = getEntry(row.uid);
      const section = e.sectionName || (row.item && row.item.sectionName) || "-";
      const task = e.taskName || (row.item && row.item.checkPoint) || "-";
      const freq = e.frequency || (row.item && row.item.frequency) || "Daily";
      const isBlank = row.type === "empty" && !(e && (e.remark || e.employeeName || e.status !== "Pending"));
      if (isBlank) return;
      w.document.write(`<tr>
        <td>${i + 1}</td>
        <td class="bg-section">${section}</td>
        <td style="text-align:left">${task}</td>
        <td>${freq}</td>
        <td>${e.employeeName || "-"}</td>
        <td>${e.status || "Pending"}</td>
        <td>${e.remark || "-"}</td>
        <td>${e.completedBy || "-"}</td>
        <td>${e.timeIn || "-"}</td>
        <td>${e.timeOut || "-"}</td>
        <td>${e.updatedBy || "-"}</td>
        <td>${siteInfo.date}</td>
        <td>${e.locationAddress || (e.latitude ? `${e.latitude}, ${e.longitude}` : "-")}</td>
      </tr>`);
    });
    w.document.write(`</tbody></table></body></html>`);
    w.document.close();
  };

  const handleDownloadExcel = () => {
    const headers = "Sr No,Section,Task,Frequency,Employee Name,Status,Remark,Completed By,Time In,Time Out,Updated By,Date,Location\n";
    let csv = headers;
    buildRowList().forEach((row, i) => {
      const e = getEntry(row.uid);
      const isBlank = row.type === "empty" && !(e && (e.remark || e.employeeName || e.status !== "Pending"));
      if (isBlank) return;
      const section = e.sectionName || (row.item && row.item.sectionName) || "-";
      const task = e.taskName || (row.item && row.item.checkPoint) || "-";
      const freq = e.frequency || (row.item && row.item.frequency) || "Daily";
      csv += `"${i + 1}","${section}","${task}","${freq}","${e.employeeName || ""}","${e.status || "Pending"}","${e.remark || ""}","${e.completedBy || ""}","${e.timeIn || ""}","${e.timeOut || ""}","${e.updatedBy || ""}","${siteInfo.date}","${e.locationAddress || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheetName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitReview = () => alert("Checklist submitted for review!");

  // ========== AUDIT HISTORY MODAL ==========
  const openAudit = async (reportId) => {
    if (!reportId) {
      alert("Save the checklist first, then you can view audit history for this row.");
      return;
    }
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      const res = await fetch(`${API_BASE}/api/checklist-report/audit/report/${reportId}`, {
        headers: { "X-User-Id": String(loggedInUser.id) },
      });
      const data = await res.json();
      setAuditRows(Array.isArray(data) ? data : []);
      setAuditReportId(reportId);
      setAuditModalOpen(true);
    } catch (e) {
      console.error("Audit load error:", e);
      alert("Failed to load audit history");
    }
  };

  // ========== HISTORY ==========
  const loadSavedReports = async (from, to) => {
    setSavedReportsLoading(true);
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) { setSavedReports([]); setSavedReportsLoading(false); return; }

      let url = `${API_BASE}/api/checklist-report/my-submissions`;
      if (from && to) {
        url = `${API_BASE}/api/checklist-report/my-submissions/date-range?from=${from}&to=${to}`;
      }
      const response = await fetch(url, { headers: { "X-User-Id": String(loggedInUser.id) } });
      const data = await response.json();
      setSavedReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load history error:", error);
      setSavedReports([]);
    } finally {
      setSavedReportsLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) return;
      const response = await fetch(`${API_BASE}/api/checklist-report/${reportId}`, {
        method: "DELETE",
        headers: { "X-User-Id": String(loggedInUser.id) },
      });
      if (!response.ok) throw new Error("Delete failed");
      alert("Deleted!");
      loadSavedReports(dateFrom, dateTo);
    } catch (error) {
      alert("Delete failed. You can only delete your own submissions.");
    }
  };

const rowList = buildRowList();

  // Compute summary from entries
  const summary = {
    total: rowList.filter(r => r.type !== "empty").length,
    yes: Object.values(entries).filter(e => e.status === "Yes").length,
    no: Object.values(entries).filter(e => e.status === "No").length,
    progress: Object.values(entries).filter(e => e.status === "In Progress").length,
    na: Object.values(entries).filter(e => e.status === "NA").length,
  };

  return (
    <Layout title="Checklist">
      <div className="checklist-wrapper">
        {/* Tabs */}
        <div className="checklist-tabs">
          <button className={`checklist-tab-btn ${activeTab === "checklist" ? "active" : ""}`} onClick={() => setActiveTab("checklist")}>
            <FaClipboardList /> Daily Checklist
          </button>
          <button className={`checklist-tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
            <FaHistory /> Saved Reports
          </button>
        </div>

        {activeTab === "checklist" && (
          <>
<div className="checklist-top-actions">
              <select value={sheetName} onChange={(e) => setSheetName(e.target.value)}>
                {sheetNames.length > 0 ? sheetNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                )) : (
                  <>
                    <option>Daily Checklist</option>
                    <option>Weekly Checklist</option>
                    <option>Monthly Checklist</option>
                    <option>Frequency Checklist</option>
                    <option>Supervisor Check list</option>
                    <option>Shift Supervisor Checklist</option>
                    <option>Daily Electrical Checklist</option>
                    <option>Daily Water Supply</option>
                    <option>Water Tanker Supply</option>
                    <option>Jobcard</option>
                    <option>Swimming Pool Checklist</option>
                  </>
                )}
              </select>
              <input type="date" value={siteInfo.date}
                onChange={(e) => setSiteInfo({ ...siteInfo, date: e.target.value })} />
              <button className="new-checklist-btn" onClick={() => navigate("/new-checklist")}><FaPlus /> New Checklist</button>
              <button className="manage-columns-btn" onClick={() => setColumnBuilderOpen(true)}><FaColumns /> Columns</button>
              <button className="add-row-btn" onClick={addCustomRow}><FaPlus /> Add Row</button>
              <button className="print-btn" onClick={handlePrint}><FaPrint /> Print / PDF</button>
            </div>

            <div className="checklist-sheet">
              {/* SSS FACILITY SERVICES HEADER - KEPT EXACTLY AS IS */}
              <div className="excel-header">
                <div className="excel-logo">
                  <div className="sss-logo">SSS</div>
                  <p>SSS Facility<br />Services</p>
                </div>
                <div className="excel-title">
                  <h1>SSS FACILITY SERVICES</h1>
                  <h2>{sheetName.toUpperCase()}</h2>
                </div>
              </div>

              {/* Site Info Grid */}
              <div className="site-grid">
                <div><b>Site Name :</b> <input value={siteInfo.siteName} onChange={(e) => setSiteInfo({ ...siteInfo, siteName: e.target.value })} /></div>
                <div><b>Building / Tower :</b> <input value={siteInfo.building} onChange={(e) => setSiteInfo({ ...siteInfo, building: e.target.value })} /></div>
                <div><b>Location :</b> <input value={siteInfo.location} onChange={(e) => setSiteInfo({ ...siteInfo, location: e.target.value })} /></div>
                <div><b>Month :</b> <input value={siteInfo.month} onChange={(e) => setSiteInfo({ ...siteInfo, month: e.target.value })} /></div>
                <div><b>Supervisor :</b> <input value={siteInfo.supervisor} onChange={(e) => setSiteInfo({ ...siteInfo, supervisor: e.target.value })} /></div>
                <div><b>Shift :</b>
                  <select value={siteInfo.shift} onChange={(e) => setSiteInfo({ ...siteInfo, shift: e.target.value })}>
                    <option>Morning</option><option>Evening</option><option>Night</option>
                  </select>
                </div>
              </div>

              <div className="note-box">
                ℹ️ This checklist is updated daily and monthly report will be sent to Site Owner.
              </div>

              {/* EXCEL-STYLE TABLE */}
              <div className="checklist-table-wrapper">
                <table className="checklist-table excel-style-table">
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>Section</th>
                      <th>Check Point / Task</th>
                      <th>Freq.</th>
                      <th>Employee Name</th>
                      <th>Status</th>
                      <th>Remark</th>
                      <th>Completed By</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Photo</th>
                      <th>Location</th>
                      <th>Updated By</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowList.map((row, index) => {
                      const entry = getEntry(row.uid);
                      const isMaster = row.type === "master";
                      const isCustom = row.type === "custom";
                      const isBlankRow = row.type === "empty";
                      const sectionValue = isMaster ? (row.item.sectionName || "-") : (entry.sectionName || (row.item && row.item.sectionName) || "");
                      const taskValue = isMaster ? row.item.checkPoint : (entry.taskName || (row.item && row.item.checkPoint) || "");
                      const freqValue = isMaster ? (row.item.frequency || "Daily") : (entry.frequency || (row.item && row.item.frequency) || "");
                      return (
                        <tr key={row.key} className={isBlankRow ? "empty-row" : ""}>
                          <td>{index + 1}</td>

                          {/* Section */}
                          <td className="bg-section">
                            {isMaster ? sectionValue : (
                              <input className="cell-input" placeholder="Section"
                                value={sectionValue}
                                onChange={(e) => onCellEdit(row.uid, "sectionName", e.target.value)} />
                            )}
                          </td>

                          {/* Check Point / Task */}
                          <td className="task-text">
                            {isMaster ? taskValue : (
                              <input className="cell-input" placeholder="Task"
                                value={taskValue}
                                onChange={(e) => onCellEdit(row.uid, "taskName", e.target.value)} />
                            )}
                          </td>

                          {/* Frequency */}
                          <td>
                            {isMaster ? freqValue : (
                              <input className="cell-input" placeholder="Freq"
                                value={freqValue}
                                onChange={(e) => onCellEdit(row.uid, "frequency", e.target.value)} />
                            )}
                          </td>

                          {/* Employee Name - Select */}
                          <td>
                            <select
                              className="cell-input employee-select"
                              value={entry.employeeName || ""}
                              onChange={(e) => onCellEdit(row.uid, "employeeName", e.target.value)}
                            >
                              <option value="">-- Select --</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.name || emp.employeeId}>
                                  {emp.name || emp.employeeId}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Status - Dropdown */}
                          <td>
                            <select
                              className={`status-select ${(entry.status || "pending").toLowerCase().replaceAll(" ", "-")}`}
                              value={entry.status || "Pending"}
                              onChange={(e) => onCellEdit(row.uid, "status", e.target.value)}
                            >
                              <option>Pending</option>
                              <option>Yes</option>
                              <option>No</option>
                              <option>In Progress</option>
                              <option>NA</option>
                            </select>
                          </td>

                          {/* Remark */}
                          <td>
                            <input className="cell-input" placeholder="Remark"
                              value={entry.remark || ""}
                              onChange={(e) => onCellEdit(row.uid, "remark", e.target.value)} />
                          </td>

                          {/* Completed By */}
                          <td>
                            <input className="cell-input" placeholder="Person"
                              value={entry.completedBy || ""}
                              onChange={(e) => onCellEdit(row.uid, "completedBy", e.target.value)} />
                          </td>

                          {/* Time In */}
                          <td>
                            <input type="time" className="cell-input time-input"
                              value={entry.timeIn || ""}
                              onChange={(e) => onCellEdit(row.uid, "timeIn", e.target.value)} />
                          </td>

                          {/* Time Out */}
                          <td>
                            <input type="time" className="cell-input time-input"
                              value={entry.timeOut || ""}
                              onChange={(e) => onCellEdit(row.uid, "timeOut", e.target.value)} />
                          </td>

                          {/* Photo */}
                          <td className="photo-cell">
                            {isBlankRow ? (
                              <span className="cell-placeholder">—</span>
                            ) : (
                              <>
                                <input type="file" accept="image/*"
                                  ref={(el) => { if (el) fileInputsRef.current[row.uid] = el; }}
                                  style={{ display: "none" }}
                                  onChange={(e) => handleRowPhoto(row.uid, e)} />
                                {entry.photoPreview ? (
                                  <div className="row-photo-container">
                                    <img src={entry.photoPreview} alt="Preview" className="row-photo-thumb" />
                                    <button className="photo-remove-btn-small" onClick={() => removeRowPhoto(row.uid)}>
                                      <FaTimes />
                                    </button>
                                  </div>
                                ) : entry.photoPath ? (
                                  <div className="row-photo-container">
                                    <img src={`${API_BASE}/uploads/checklist/${entry.photoName}`} alt="Uploaded" className="row-photo-thumb"
                                      onError={(e) => { e.target.style.display = "none"; }} />
                                    <button className="photo-remove-btn-small" onClick={() => removeRowPhoto(row.uid)}>
                                      <FaTimes />
                                    </button>
                                  </div>
                                ) : (
                                  <button className="cell-icon-btn" onClick={() => fileInputsRef.current[row.uid]?.click()}
                                    title="Upload photo">
                                    <FaCamera />
                                  </button>
                                )}
                              </>
                            )}
                          </td>

                          {/* Live Location */}
                          <td className="location-cell">
                            {isBlankRow ? (
                              <span className="cell-placeholder">—</span>
                            ) : entry.locationAddress ? (
                              <span className="location-address-cell" title={entry.locationAddress}>
                                📍 {entry.locationAddress.split(",")[0]},
                                {entry.latitude && <a href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`} target="_blank" rel="noreferrer" className="map-link"> Map</a>}
                              </span>
                            ) : (
                              <button className="cell-icon-btn" onClick={() => getLocationForRow(row.uid)}
                                disabled={locationLoading} title="Get location">
                                <FaMapMarkerAlt />
                              </button>
                            )}
                          </td>

                          {/* Updated By */}
                          <td>
                            <span className="updated-by-cell">{entry.updatedBy || "-"}</span>
                          </td>

                          {/* Date */}
                          <td>
                            <span className="date-cell">{siteInfo.date}</span>
                          </td>

                          {/* Action */}
                          <td>
                            {!isBlankRow && (
                              <>
                                <button className="icon-btn edit" title="Audit History"
                                  onClick={() => openAudit(entry.savedReportId)}><FaHistory /></button>
                                <button className="icon-btn delete" title="Delete Row"
                                  onClick={() => {
                                    if (isMaster) {
                                      if (window.confirm("Reset this row? (Master rows come from the checklist template)")) deleteRow(row.uid);
                                    } else {
                                      if (window.confirm("Delete this row?")) deleteRow(row.uid);
                                    }
                                  }}><FaTrash /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Cards */}
              <div className="bottom-panels">
                <div className="summary-card">
                  <h3>Monthly Summary</h3>
                  <p>Total Tasks: <b>{summary.total}</b></p>
                  <p className="green">Completed Yes: <b>{summary.yes}</b></p>
                  <p className="blue">In Progress: <b>{summary.progress}</b></p>
                  <p className="red">Not Completed No: <b>{summary.no}</b></p>
                  <p>NA: <b>{summary.na}</b></p>
                </div>
                <div className="summary-card">
                  <h3>Site / Building Information</h3>
                  <p>Site: <b>{siteInfo.siteName}</b></p>
                  <p>Building: <b>{siteInfo.building}</b></p>
                  <p>Location: <b>{siteInfo.location}</b></p>
                  <p>Month: <b>{siteInfo.month}</b></p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="checklist-actions">
                <button className="save-btn" onClick={handleSave}><FaSave /> Save Checklist</button>
                <button className="review-btn" onClick={handleSubmitReview}>Submit for Review</button>
                <button className="preview-btn" onClick={handlePreview}><FaEye /> Preview Report</button>
                <button className="download-btn" onClick={handleDownloadExcel}><FaDownload /> Download Excel</button>
              </div>
            </div>
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="checklist-sheet">
            <div className="history-header">
              <h3>📋 Saved Checklist Reports</h3>
              <div className="history-filters">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                <button className="filter-btn" onClick={() => loadSavedReports(dateFrom, dateTo)}>Filter</button>
                <button className="filter-btn clear" onClick={() => { setDateFrom(""); setDateTo(""); loadSavedReports(); }}>Clear</button>
              </div>
            </div>

            {savedReportsLoading ? <p className="loading-text">Loading...</p>
              : savedReports.length === 0 ? <p className="loading-text">No saved reports found.</p>
              : (
                <div className="history-table-wrapper">
                  <table className="checklist-table history-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Sheet</th><th>Site</th><th>Shift</th>
                        <th>Task</th><th>Status</th><th>Remark</th>
                        <th>Employee</th><th>By</th><th>In</th><th>Out</th>
                        <th>Updated By</th><th>Location</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedReports.map((r) => (
                        <tr key={r.id}>
                          <td>{r.reportDate}</td>
                          <td>{r.sheetName || "-"}</td>
                          <td>{r.siteName || r.siteCode || "-"}</td>
                          <td>{r.shift || "-"}</td>
                          <td className="task-text">{r.taskName || "-"}</td>
                          <td><span className={`status-badge ${(r.status || "").toLowerCase()}`}>{r.status || "Pending"}</span></td>
                          <td>{r.remark || "-"}</td>
                          <td>{r.employeeName || "-"}</td>
                          <td>{r.completedBy || "-"}</td>
                          <td>{r.timeIn || "-"}</td>
                          <td>{r.timeOut || "-"}</td>
                          <td>{r.updatedBy || "-"}</td>
                          <td>
                            {r.locationAddress ? (
                              <span>{r.locationAddress.split(",")[0]}
                                {r.latitude && <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer" className="map-link"> Map</a>}
                              </span>
                            ) : r.latitude ? `${r.latitude},${r.longitude}` : "-"}
                          </td>
                          <td>
                            <button className="icon-btn edit" onClick={() => openAudit(r.id)} title="Audit History"><FaHistory /></button>
                            <button className="icon-btn delete" onClick={() => handleDeleteReport(r.id)}><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {savedReports.length > 0 && (
              <div className="history-export-actions">
                <button className="preview-btn" onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(`
                    <html><head><title>Saved Reports</title>
                    <style>body{font-family:Arial;padding:20px;}h1{color:#5b2bd8;text-align:center;}
                    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px;}
                    th,td{border:1px solid #ccc;padding:4px;text-align:center;}
                    th{background:#5b2bd8;color:white;}</style></head><body>
                    <h1>SSS FACILITY SERVICES</h1>
                    <h2>Saved Reports</h2>
                    <p>Period: ${dateFrom || "All"} to ${dateTo || "All"}</p>
                    <table><thead><tr>
                      <th>Date</th><th>Sheet</th><th>Site</th><th>Shift</th><th>Task</th>
                      <th>Status</th><th>Remark</th><th>Employee</th><th>By</th><th>In</th><th>Out</th><th>Updated By</th><th>Location</th>
                    </tr></thead><tbody>
                    ${savedReports.map(r => `<tr>
                      <td>${r.reportDate}</td><td>${r.sheetName || "-"}</td><td>${r.siteName || r.siteCode || "-"}</td>
                      <td>${r.shift || "-"}</td><td style="text-align:left">${r.taskName || "-"}</td>
                      <td>${r.status || "Pending"}</td><td>${r.remark || "-"}</td>
                      <td>${r.employeeName || "-"}</td><td>${r.completedBy || "-"}</td>
                      <td>${r.timeIn || "-"}</td><td>${r.timeOut || "-"}</td>
                      <td>${r.updatedBy || "-"}</td>
                      <td>${r.locationAddress || (r.latitude ? `${r.latitude},${r.longitude}` : "-")}</td>
                    </tr>`).join("")}
                    </tbody></table></body></html>
                  `);
                  w.document.close();
                }}><FaEye /> Print PDF</button>
                <button className="download-btn" onClick={() => {
                  let csv = "Date,Sheet,Site,Shift,Task,Status,Remark,Employee,Completed By,Time In,Time Out,Updated By,Location\n";
                  savedReports.forEach(r => {
                    csv += `"${r.reportDate}","${r.sheetName||"-"}","${r.siteName||r.siteCode||"-"}","${r.shift||"-"}","${r.taskName||"-"}","${r.status||"Pending"}","${r.remark||"-"}","${r.employeeName||"-"}","${r.completedBy||"-"}","${r.timeIn||"-"}","${r.timeOut||"-"}","${r.updatedBy||"-"}","${r.locationAddress||(r.latitude?r.latitude+","+r.longitude:"-")}"\n`;
                  });
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "checklist-reports.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}><FaDownload /> Download Excel</button>
              </div>
            )}
          </div>
        )}
      </div>

{/* COLUMN BUILDER MODAL */}
      {columnBuilderOpen && (
        <div className="column-builder-overlay" onClick={() => setColumnBuilderOpen(false)}>
          <div className="column-builder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="column-builder-header">
              <h3><FaColumns /> Manage Columns</h3>
              <button className="column-builder-close" onClick={() => setColumnBuilderOpen(false)}><FaTimes /></button>
            </div>
            <div className="column-builder-body">
              <div className="column-builder-list">
                {columns.filter(c => !c.locked).map((col) => (
                  <div key={col.key} className="column-builder-item">
                    {renamingColKey === col.key ? (
                      <input className="col-rename-input" autoFocus
                        value={renamingColValue}
                        onChange={(e) => setRenamingColValue(e.target.value)}
                        onBlur={() => { renameColumn(col.key, renamingColValue); setRenamingColKey(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { renameColumn(col.key, renamingColValue); setRenamingColKey(null); } }} />
                    ) : (
                      <span className="col-label">{col.label}</span>
                    )}
                    <span className="col-type">{col.type}</span>
                    <div className="col-actions">
                      <button className="col-rename-btn" onClick={() => { setRenamingColKey(col.key); setRenamingColValue(col.label); }}>Rename</button>
                      <button className="col-remove-btn" onClick={() => removeColumn(col.key)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="column-builder-add-row">
                <input placeholder="Column name" value={newColLabel} onChange={(e) => setNewColLabel(e.target.value)} />
                <select value={newColType} onChange={(e) => setNewColType(e.target.value)}>
                  <option value="text">Text</option>
                  <option value="status">Status</option>
                  <option value="time">Time</option>
                  <option value="date">Date</option>
                  <option value="photo">Photo</option>
                  <option value="location">Location</option>
                  <option value="employee">Employee</option>
                </select>
                <button className="col-add-btn" onClick={addColumn}>+ Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT HISTORY MODAL */}
      {auditModalOpen && (
        <div className="audit-modal-overlay" onClick={() => setAuditModalOpen(false)}>
          <div className="audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3><FaHistory /> Audit History {auditReportId ? `(Report #${auditReportId})` : ""}</h3>
              <button className="audit-modal-close" onClick={() => setAuditModalOpen(false)}><FaTimes /></button>
            </div>
            <div className="audit-modal-body">
              {auditRows.length === 0 ? (
                <p className="loading-text">No audit entries yet. Changes will be tracked after you save.</p>
              ) : (
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Time</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Changed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((log) => (
                      <tr key={log.id}>
                        <td>{log.changedAt ? new Date(log.changedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                        <td><b>{log.fieldName}</b></td>
                        <td>{log.oldValue || "-"}</td>
                        <td>{log.newValue || "-"}</td>
                        <td>{log.changedBy || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Checklist;

