import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./attendance.css";
import { useAttendance } from "../../hooks/useAttendance";

const format12Hour = (timeStr) => {
  if (!timeStr) return "-";
  const parts = String(timeStr).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const calculateTotalHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "-";
  const partsIn = String(checkIn).split(":");
  const partsOut = String(checkOut).split(":");
  const inMin = Number(partsIn[0]) * 60 + Number(partsIn[1]);
  const outMin = Number(partsOut[0]) * 60 + Number(partsOut[1]);
  if (!Number.isFinite(inMin) || !Number.isFinite(outMin)) return "-";
  const diff = Math.max(0, outMin - inMin);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
};

const API_BASE_URL = "https://task-management-system-production-7694.up.railway.app";

// Convert a stored selfie path into an accessible image URL.
// Handles: uploads/attendance/file.jpg, /uploads/attendance/file.jpg, bare filename.jpg
const toSelfieSrc = (raw) => {
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const path = String(raw).replace(/\\/g, "/");
  if (path.startsWith("uploads/")) return `${API_BASE_URL}/${path}`;
  if (path.startsWith("/uploads/")) return `${API_BASE_URL}${path}`;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  // Bare filename -> assume under uploads/attendance/
  return `${API_BASE_URL}/uploads/attendance/${path}`;
};

// Render a selfie thumbnail or "No Selfie" placeholder.
const renderSelfieCell = (path) => {
  const url = toSelfieSrc(path);
  if (!url) {
    return <span className="att-no-selfie">No Selfie</span>;
  }
  return (
    <img
      src={url}
      alt="selfie"
      className="table-img"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      style={{ cursor: "pointer" }}
    />
  );
};

function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    user,
    userId,
    userName,
    userRole,
    canSeeAll,
    filterEmployee,
    setFilterEmployee,
    location,
    locationError,
    today,
    loading,
    filteredAttendance,
    todayRecord,
    todaySummary,
    punchIn,
    punchOut,
    markHalfDay,
    markHoliday,
    markWeekOff,
    clearData,
  } = useAttendance();

  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError("Camera permission allow karo"));
  }, []);

  const captureFromCamera = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return "";
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const [punchBusy, setPunchBusy] = useState(false);

  const handlePunchIn = async () => {
    setPunchBusy(true);
    try {
      const photo = captureFromCamera();
      await punchIn(photo);
      alert("Punch In successful ✅");
    } finally {
      setPunchBusy(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchBusy(true);
    try {
      const photo = captureFromCamera();
      const res = await punchOut(photo);
      if (!res?.ok) {
        alert(res?.reason || "Punch Out failed");
      } else {
        alert("Punch Out successful ✅");
      }
    } finally {
      setPunchBusy(false);
    }
  };

  return (
    <Layout title="Attendance">
      <div className="attendance-page">
        <div className="loc-time-bar">
          <span>📍 {location}</span>
          <span>🕐 {new Date().toLocaleTimeString("en-IN")}</span>
        </div>
        {locationError && <p className="loc-error">⚠️ {locationError}</p>}
        {cameraError && <p className="loc-error">⚠️ {cameraError}</p>}

        <div className="attendance-card">
          <h2>Selfie Attendance</h2>
          <p className="att-name">👤 {userName} &nbsp;|&nbsp; 📅 {today}</p>

          <div className="summary-grid">
            <div className="summary-pill">💼 Total Work: {todaySummary?.totalWorkingMinutes ? `${todaySummary.totalWorkingMinutes} min` : "-"}</div>
            <div className="summary-pill">☕ Break: {todaySummary?.breakMinutes ? `${todaySummary.breakMinutes} min` : "-"}</div>
            <div className="summary-pill">🟢 First In: {todaySummary?.firstPunchIn || "-"}</div>
            <div className="summary-pill">🔵 Final Out: {todaySummary?.finalPunchOut || "-"}</div>
          </div>

          <div className="today-chips">
            {todayRecord?.sessions?.some((s) => s?.punchIn) && (
              <span className="chip chip-in">✅ First In: {todaySummary?.firstPunchIn || "-"}</span>
            )}
            {todayRecord?.sessions?.some((s) => s?.punchOut) && (
              <span className="chip chip-out">🚪 Final Out: {todaySummary?.finalPunchOut || "-"}</span>
            )}
            {todayRecord?.dayMode === "HALF_DAY" && <span className="chip chip-half">🕓 Half Day</span>}
            {todayRecord?.dayType === "Holiday" && <span className="chip chip-holiday">🎉 Holiday</span>}
            {todayRecord?.dayType === "Week Off" && <span className="chip chip-weekoff">📅 Week Off</span>}
          </div>

          {/* Session history */}
          <div className="session-history">
            <h3>Session History</h3>
            {!todayRecord?.sessions?.length ? (
              <div className="empty-session">No sessions yet</div>
            ) : (
              <div className="session-list">
                {todayRecord.sessions
                  .slice()
                  .sort((a, b) => (a?.punchIn || "").localeCompare(b?.punchIn || ""))
                  .map((s, idx) => (
                    <div key={`${s.punchIn || ""}-${idx}`} className="session-item">
                      <div className="session-time">
                        <span className="session-tag">In</span> {s.punchIn || "-"}
                      </div>
                      <div className="session-time">
                        <span className="session-tag">Out</span> {s.punchOut || "(active)"}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="camera-box">
            <video ref={videoRef} autoPlay playsInline muted></video>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            <div className="camera-overlay-info">
              <span>📍 {location}</span>
              <span>🕐 {new Date().toLocaleTimeString("en-IN")}</span>
            </div>
          </div>

          {/* Today's photos (legacy/compat: use first in photo and last out photo if present) */}
          {(todayRecord?.sessions?.some((s) => s?.punchInPhoto) || todayRecord?.sessions?.some((s) => s?.punchOutPhoto)) && (
            <div className="photos-row">
              {(() => {
                const inSession = todayRecord.sessions.filter((s) => s?.punchInPhoto).slice().sort((a, b) => (a?.punchIn || "").localeCompare(b?.punchIn || ""))[0];
                const outSession = todayRecord.sessions.filter((s) => s?.punchOutPhoto).slice().sort((a, b) => (a?.punchOut || "").localeCompare(b?.punchOut || "")).pop();
                return (
                  <>
                    {inSession?.punchInPhoto && (
                      <div className="photo-preview">
                        <p>Punch In Photo</p>
                        <img src={inSession.punchInPhoto} alt="punch-in" />
                      </div>
                    )}
                    {outSession?.punchOutPhoto && (
                      <div className="photo-preview">
                        <p>Punch Out Photo</p>
                        <img src={outSession.punchOutPhoto} alt="punch-out" />
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="pill-buttons">
            <button className="pill pill-green" onClick={handlePunchIn} disabled={punchBusy}>
              ✅ Punch In
            </button>
            <button className="pill pill-orange" onClick={handlePunchOut} disabled={punchBusy}>
              🚪 Punch Out
            </button>
            <button className="pill pill-yellow" onClick={markHalfDay}>
              🕓 Half Day
            </button>
            <button className="pill pill-blue" onClick={markHoliday}>
              🎉 Holiday
            </button>
            <button className="pill pill-purple" onClick={markWeekOff}>
              📅 Week Off
            </button>
            {canSeeAll && (
              <button className="pill pill-red" onClick={clearData}>
                🗑 Clear Data
              </button>
            )}
          </div>
        </div>

        <div className="attendance-card">
          <h2>📊 {canSeeAll ? "All Employees Attendance" : "My Attendance"}</h2>

          {canSeeAll && (
            <input
              className="att-search"
              type="text"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              placeholder="🔍 Search employee..."
            />
          )}

          {loading ? (
            <div className="empty-row">Loading attendance...</div>
          ) : (
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
<tr>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Punch In Selfie</th>
                    <th>Punch Out Selfie</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-row">
                        No attendance found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item, index) => {
                      const normalized = item;
                      const sessions = normalized.sessions || [];
                      const checkIn = sessions.length > 0
                        ? sessions
                            .filter((s) => s.punchIn)
                            .sort((a, b) => (a.punchIn || "").localeCompare(b.punchIn || ""))[0]?.punchIn
                        : normalized.punchIn || "";
                      const checkOut = sessions.length > 0
                        ? sessions
                            .filter((s) => s.punchOut)
                            .sort((a, b) => (a.punchOut || "").localeCompare(b.punchOut || ""))
                            .pop()?.punchOut
                        : normalized.punchOut || "";

                      let status = "-";
                      if (checkIn && checkOut) {
                        status = "Present";
                      } else if (checkIn) {
                        status = "Checked In";
                      } else if (normalized.dayType === "Holiday") {
                        status = "Holiday";
                      } else if (normalized.dayType === "Week Off") {
                        status = "Week Off";
                      } else if (normalized.dayMode === "HALF_DAY") {
                        status = "Half Day";
                      }

// Location: display only the actual attendance.location address.
                      // Do NOT show latitude/longitude anywhere in the UI.
                      const loc =
                        normalized.location ||
                        normalized.checkInAddress ||
                        normalized.checkOutAddress ||
                        normalized.latestLiveAddress ||
                        "-";

                      // Resolve selfie paths from sessions (fall back to top-level fields).
                      // Sessions already carry absolute URLs via toAbsoluteSelfie().
                      const checkInSelfie =
                        sessions.find((s) => s?.punchInPhoto)?.punchInPhoto ||
                        normalized.checkInSelfieUrl ||
                        normalized.checkInSelfiePath ||
                        normalized.checkInSelfiePhoto ||
                        "";
                      const checkOutSelfie =
                        sessions.find((s) => s?.punchOutPhoto)?.punchOutPhoto ||
                        normalized.checkOutSelfieUrl ||
                        normalized.checkOutSelfiePath ||
                        normalized.checkOutSelfiePhoto ||
                        "";

                      return (
                        <tr key={index}>
                          <td>{normalized.employeeName || "-"}</td>
                          <td>{normalized.date || "-"}</td>
                          <td>{format12Hour(checkIn)}</td>
                          <td>{format12Hour(checkOut)}</td>
                          <td>{calculateTotalHours(checkIn, checkOut)}</td>
                          <td>
                            <span className={`status-badge ${status.toLowerCase().replace(/\s+/g, "-")}`}>
                              {status}
                            </span>
                          </td>
                          <td className="location-cell">{loc}</td>
                          <td>{renderSelfieCell(checkInSelfie)}</td>
                          <td>{renderSelfieCell(checkOutSelfie)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Attendance;
