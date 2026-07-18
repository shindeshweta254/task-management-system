import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./attendance.css";
import { useAttendance } from "../../hooks/useAttendance";

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
      punchIn(photo);
      alert("Punch In successful ✅");
    } finally {
      setPunchBusy(false);
    }
  };

  const handlePunchOut = async () => {
    setPunchBusy(true);
    try {
      const photo = captureFromCamera();
      const res = punchOut(photo);
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
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>First In</th>
                    <th>Final Out</th>
                    <th>Total Work</th>
                    <th>Break</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        No attendance found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item, index) => {
                      const normalized = item; // already normalized by hook
                      const summary = normalized
                        ? {
                            ...todaySummary,
                            ...todaySummary,
                          }
                        : null;

                      // Calculate per-row using hook util from sessions, but to avoid duplication,
                      // we rely on the legacy top-level fields if present.
                      // If sessions-only rows exist, the backend limitation is handled by localStorage fallback.
                      // For now, show placeholders for late/early/overtime columns removed from this compact UI.

                      return (
                        <tr key={index}>
                          <td>{normalized.employeeName || "-"}</td>
                          <td>{normalized.date || "-"}</td>
                          <td className="location-cell">{normalized.location || "-"}</td>
                          <td>{normalized?.sessions?.[0]?.punchIn || normalized.punchIn || "-"}</td>
                          <td>{normalized?.sessions?.slice().reverse().find((s) => s?.punchOut)?.punchOut || normalized.punchOut || "-"}</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
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

