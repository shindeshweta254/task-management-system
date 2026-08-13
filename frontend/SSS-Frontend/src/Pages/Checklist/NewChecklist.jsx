import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { getAuthHeaders } from "../../api/index";
import "./Checklist.css";
import {
  FaSave,
  FaTimes,
  FaCamera,
  FaMapMarkerAlt,
  FaPlus,
  FaColumns,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";

const API_BASE = "http://localhost:8080";

// Default columns for a new blank checklist
const DEFAULT_COLUMNS = [
  { key: "sr", label: "Sr No", type: "sr", locked: true },
  { key: "employee", label: "Employee", type: "employee" },
  { key: "date", label: "Date", type: "date", readonly: true },
  { key: "action", label: "Action", type: "action", locked: true },
];

// Minimum blank rows like Excel
const MIN_ROWS = 20;

function NewChecklist() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [sheetName, setSheetName] = useState("New Checklist");
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  // Column builder state
  const [columnBuilderOpen, setColumnBuilderOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState("text");
  const [renamingColKey, setRenamingColKey] = useState(null);
  const [renamingColValue, setRenamingColValue] = useState("");

  // Photo refs
  const fileInputsRef = useRef({});

  // ========== LOAD EMPLOYEES ==========
  const loadEmployees = useCallback(async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) return;
      const headers = getAuthHeaders();
      let data = null;
      try {
        const res = await fetch(`${API_BASE}/api/users/my-site-team`, { headers });
        if (res.ok) data = await res.json();
      } catch (e) {}
      if (!Array.isArray(data)) {
        const res = await fetch(`${API_BASE}/api/users`, { headers });
        data = await res.json();
      }
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // ========== BUILD ROW LIST ==========
  const buildRowList = () => {
    const existing = rows.map((r, i) => ({ ...r, idx: i }));
    const total = existing.length;
    const empties = [];
    for (let i = total; i < MIN_ROWS; i++) {
      empties.push({ uid: `empty-${i}`, type: "empty" });
    }
    return [...existing, ...empties];
  };

  // ========== CELL EDIT ==========
  const updateCell = (uid, field, value) => {
    setRows((prev) => {
      const existing = prev.find((r) => r.uid === uid);
      if (existing) {
        return prev.map((r) =>
          r.uid === uid ? { ...r, [field]: value } : r
        );
      }
      // If empty row, convert to real row
      if (uid.startsWith("empty-")) {
        const newUid = `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return [
          ...prev,
          {
            uid: newUid,
            [field]: value,
            extra: {},
            employee: "",
            date: new Date().toISOString().split("T")[0],
          },
        ];
      }
      return prev;
    });
  };

  // ========== ADD ROW ==========
  const addRow = () => {
    const uid = `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setRows((prev) => [
      ...prev,
      {
        uid,
        extra: {},
        employee: "",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  // ========== DELETE ROW ==========
  const deleteRow = (uid) => {
    setRows((prev) => prev.filter((r) => r.uid !== uid));
  };

  // ========== EXTRA COLUMN CELL EDIT ==========
  const updateExtraCell = (uid, colKey, value) => {
    setRows((prev) => {
      const existing = prev.find((r) => r.uid === uid);
      if (existing) {
        return prev.map((r) =>
          r.uid === uid
            ? { ...r, extra: { ...r.extra, [colKey]: value } }
            : r
        );
      }
      // Convert empty row
      if (uid.startsWith("empty-")) {
        const newUid = `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        return [
          ...prev,
          {
            uid: newUid,
            extra: { [colKey]: value },
            employee: "",
            date: new Date().toISOString().split("T")[0],
          },
        ];
      }
      return prev;
    });
  };

  // ========== PHOTO HANDLING ==========
  const handleRowPhoto = async (uid, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      updateCell(uid, "photoPreview", ev.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/checklist-report/photo`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        updateCell(uid, "photoName", data.photoName);
        updateCell(uid, "photoPath", data.photoPath);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    }

    // Capture GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          updateCell(uid, "latitude", String(latitude));
          updateCell(uid, "longitude", String(longitude));
          updateCell(uid, "locationAddress", address);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const removeRowPhoto = (uid) => {
    setRows((prev) =>
      prev.map((r) =>
        r.uid === uid
          ? { ...r, photoPreview: undefined, photoName: "", photoPath: "" }
          : r
      )
    );
  };

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

  // ========== GET LOCATION ==========
  const getLocationForRow = async (uid) => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        updateCell(uid, "latitude", String(latitude));
        updateCell(uid, "longitude", String(longitude));
        updateCell(uid, "locationAddress", address);
        setLocationLoading(false);
      },
      (err) => {
        alert("Location error: " + err.message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
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

  // ========== SAVE ==========
  const handleSave = async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (!loggedInUser?.id) {
        alert("Login required");
        return;
      }

      const entriesList = [];
      rows.forEach((row) => {
        entriesList.push({
          siteCode: user.siteCode || "",
          siteName: user.siteName || "",
          sheetName: sheetName,
          employeeName: row.employee || "",
          status: row.status || "Pending",
          remark: row.remark || "",
          sectionName: row.section || "",
          taskName: row.task || "",
          timeIn: row.timeIn || "",
          timeOut: row.timeOut || "",
          completedBy: row.completedBy || "",
          reportDate: row.date || new Date().toISOString().split("T")[0],
          latitude: row.latitude || "",
          longitude: row.longitude || "",
          locationAddress: row.locationAddress || "",
          photoName: row.photoName || "",
          photoPath: row.photoPath || "",
          extraJson: JSON.stringify(row.extra || {}),
        });
      });

      // Save as custom checklist sheet
      const payload = {
        kind: "CUSTOM",
        sheetName: sheetName,
        columnsJson: JSON.stringify(columns),
        rowsJson: JSON.stringify(rows),
        siteName: user.siteName || "",
        reportDate: new Date().toISOString().split("T")[0],
      };
      const sheetRes = await fetch(`${API_BASE}/api/checklist-sheet/save`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!sheetRes.ok) {
        alert("Failed to save checklist sheet");
        return;
      }

      // Save entries if any
      if (entriesList.length > 0) {
        const res = await fetch(`${API_BASE}/api/checklist-report/batch-save`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(entriesList),
        });

        if (!res.ok) {
          alert("Failed to save entries");
          return;
        }
      }

      alert("Checklist saved successfully!");
      navigate("/checklist");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving checklist");
    }
  };

  const rowList = buildRowList();

  // ========== RENDER CELL VALUE ==========
  const renderCell = (row, col) => {
    const isBlankRow = row.type === "empty";
    const uid = row.uid;

    switch (col.type) {
      case "sr":
        return null; // handled by index

      case "employee":
        return (
          <select
            className="cell-input employee-select"
            value={row.employee || ""}
            onChange={(e) => updateCell(uid, "employee", e.target.value)}
          >
            <option value="">-- Select --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name || emp.employeeId}>
                {emp.name || emp.employeeId}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            className="cell-input"
            value={row.date || new Date().toISOString().split("T")[0]}
            onChange={(e) => updateCell(uid, "date", e.target.value)}
          />
        );

      case "status":
        return (
          <select
            className="cell-input status-select"
            value={row.status || "Pending"}
            onChange={(e) => updateCell(uid, "status", e.target.value)}
          >
            <option>Pending</option>
            <option>Yes</option>
            <option>No</option>
            <option>In Progress</option>
            <option>NA</option>
          </select>
        );

      case "time":
        return (
          <input
            type="time"
            className="cell-input"
            value={row[col.key] || ""}
            onChange={(e) => updateCell(uid, col.key, e.target.value)}
          />
        );

      case "photo":
        return isBlankRow ? (
          <span className="cell-placeholder">—</span>
        ) : (
          <>
            <input
              type="file"
              accept="image/*"
              ref={(el) => {
                if (el) fileInputsRef.current[uid] = el;
              }}
              style={{ display: "none" }}
              onChange={(e) => handleRowPhoto(uid, e)}
            />
            {row.photoPreview ? (
              <div className="row-photo-container">
                <img src={row.photoPreview} alt="Preview" className="row-photo-thumb" />
                <button className="photo-remove-btn-small" onClick={() => removeRowPhoto(uid)}>
                  <FaTimes />
                </button>
              </div>
            ) : row.photoPath ? (
              <div className="row-photo-container">
                <img
                  src={`${API_BASE}/uploads/checklist/${row.photoName}`}
                  alt="Uploaded"
                  className="row-photo-thumb"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <button className="photo-remove-btn-small" onClick={() => removeRowPhoto(uid)}>
                  <FaTimes />
                </button>
              </div>
            ) : (
              <button
                className="cell-icon-btn"
                onClick={() => fileInputsRef.current[uid]?.click()}
                title="Upload photo"
              >
                <FaCamera />
              </button>
            )}
          </>
        );

      case "location":
        return isBlankRow ? (
          <span className="cell-placeholder">—</span>
        ) : row.locationAddress ? (
          <span className="location-address-cell" title={row.locationAddress}>
            📍 {row.locationAddress.split(",")[0]}
            {row.latitude && (
              <a
                href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="map-link"
              >
                {" "}
                Map
              </a>
            )}
          </span>
        ) : (
          <button
            className="cell-icon-btn"
            onClick={() => getLocationForRow(uid)}
            disabled={locationLoading}
            title="Get location"
          >
            <FaMapMarkerAlt />
          </button>
        );

      case "action":
        return !isBlankRow ? (
          <button
            className="icon-btn delete"
            title="Delete Row"
            onClick={() => {
              if (window.confirm("Delete this row?")) deleteRow(uid);
            }}
          >
            <FaTrash />
          </button>
        ) : null;

      default:
        // Custom columns (text or other types stored in extra)
        return (
          <input
            className="cell-input"
            placeholder={col.label}
            value={row.extra?.[col.key] || ""}
            onChange={(e) => updateExtraCell(uid, col.key, e.target.value)}
          />
        );
    }
  };

  return (
    <Layout title="New Checklist">
      <div className="checklist-wrapper">
        <div className="checklist-top-actions">
          <button className="back-btn" onClick={() => navigate("/checklist")}>
            <FaArrowLeft /> Back to Checklist
          </button>
          <input
            className="sheet-name-input"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="Checklist Name"
          />
          <button className="manage-columns-btn" onClick={() => setColumnBuilderOpen(true)}>
            <FaColumns /> Columns
          </button>
          <button className="add-row-btn" onClick={addRow}>
            <FaPlus /> Add Row
          </button>
          <button className="save-btn" onClick={handleSave}>
            <FaSave /> Save Checklist
          </button>
        </div>

        <div className="checklist-sheet">
          <div className="checklist-table-wrapper">
            <table className="checklist-table excel-style-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowList.map((row, index) => {
                  const isBlankRow = row.type === "empty";
                  return (
                    <tr key={row.uid} className={isBlankRow ? "empty-row" : ""}>
                      {columns.map((col) => (
                        <td key={col.key} className={col.type === "photo" ? "photo-cell" : col.type === "location" ? "location-cell" : ""}>
                          {col.type === "sr" ? (
                            index + 1
                          ) : (
                            renderCell(row, col)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* COLUMN BUILDER MODAL */}
      {columnBuilderOpen && (
        <div className="column-builder-overlay" onClick={() => setColumnBuilderOpen(false)}>
          <div className="column-builder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="column-builder-header">
              <h3>
                <FaColumns /> Manage Columns
              </h3>
              <button className="column-builder-close" onClick={() => setColumnBuilderOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="column-builder-body">
              <div className="column-builder-list">
                {columns
                  .filter((c) => !c.locked)
                  .map((col) => (
                    <div key={col.key} className="column-builder-item">
                      {renamingColKey === col.key ? (
                        <input
                          className="col-rename-input"
                          autoFocus
                          value={renamingColValue}
                          onChange={(e) => setRenamingColValue(e.target.value)}
                          onBlur={() => {
                            renameColumn(col.key, renamingColValue);
                            setRenamingColKey(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameColumn(col.key, renamingColValue);
                              setRenamingColKey(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="col-label">{col.label}</span>
                      )}
                      <span className="col-type">{col.type}</span>
                      <div className="col-actions">
                        <button
                          className="col-rename-btn"
                          onClick={() => {
                            setRenamingColKey(col.key);
                            setRenamingColValue(col.label);
                          }}
                        >
                          Rename
                        </button>
                        <button className="col-remove-btn" onClick={() => removeColumn(col.key)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="column-builder-add-row">
                <input
                  placeholder="Column name"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                />
                <select value={newColType} onChange={(e) => setNewColType(e.target.value)}>
                  <option value="text">Text</option>
                  <option value="status">Status</option>
                  <option value="time">Time</option>
                  <option value="date">Date</option>
                  <option value="photo">Photo</option>
                  <option value="location">Location</option>
                  <option value="employee">Employee</option>
                </select>
                <button className="col-add-btn" onClick={addColumn}>
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default NewChecklist;
