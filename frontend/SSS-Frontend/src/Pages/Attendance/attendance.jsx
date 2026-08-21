import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./attendance.css";
import { useAttendance } from "../../hooks/useAttendance";

const API_BASE_URL =
  "https://task-management-system-production-7694.up.railway.app";

const format12Hour = (timeStr) => {
  if (!timeStr) return "-";

  const parts = String(timeStr).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return timeStr;
  }

  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const calculateTotalHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "-";

  const partsIn = String(checkIn).split(":");
  const partsOut = String(checkOut).split(":");

  const inMin =
    Number(partsIn[0]) * 60 + Number(partsIn[1]);

  const outMin =
    Number(partsOut[0]) * 60 + Number(partsOut[1]);

  if (!Number.isFinite(inMin) || !Number.isFinite(outMin)) {
    return "-";
  }

  const diff = Math.max(0, outMin - inMin);

  const h = Math.floor(diff / 60);
  const m = diff % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;

  return `${h} hr ${m} min`;
};

const toSelfieSrc = (raw) => {
  if (!raw) return "";

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return raw;
  }

  const path = String(raw).replace(/\\/g, "/");

  if (path.startsWith("uploads/")) {
    return `${API_BASE_URL}/${path}`;
  }

  if (path.startsWith("/uploads/")) {
    return `${API_BASE_URL}${path}`;
  }

  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/uploads/attendance/${path}`;
};

const renderSelfieCell = (path) => {
  const url = toSelfieSrc(path);

  if (!url) {
    return (
      <span className="att-no-selfie">
        No Selfie
      </span>
    );
  }

  return (
    <img
      src={url}
      alt="Attendance selfie"
      className="table-img"
      onClick={() =>
        window.open(url, "_blank", "noopener,noreferrer")
      }
      style={{ cursor: "pointer" }}
    />
  );
};

function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraError, setCameraError] = useState("");
  const [punchBusy, setPunchBusy] = useState(false);

  const {
    userName,
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
  } = useAttendance();

  /*
   * Live clock.
   * Updates every second.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const liveTime = currentTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  /*
   * Camera.
   */
  useEffect(() => {
    let stream;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((cameraStream) => {
        stream = cameraStream;

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      })
      .catch(() => {
        setCameraError(
          "Camera permission allow karo."
        );
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFromCamera = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return "";
    }

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    const context = canvas.getContext("2d");

    if (!context) {
      return "";
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handlePunchIn = async () => {
    if (punchBusy) return;

    setPunchBusy(true);

    try {
      const photo = captureFromCamera();

      await punchIn(photo);

      alert("Punch In successful.");
    } catch (error) {
      console.error("Punch In error:", error);
      alert("Punch In failed.");
    } finally {
      setPunchBusy(false);
    }
  };

  const handlePunchOut = async () => {
    if (punchBusy) return;

    setPunchBusy(true);

    try {
      const photo = captureFromCamera();

      const result = await punchOut(photo);

      if (!result?.ok) {
        alert(result?.reason || "Punch Out failed.");
      } else {
        alert("Punch Out successful.");
      }
    } catch (error) {
      console.error("Punch Out error:", error);
      alert("Punch Out failed.");
    } finally {
      setPunchBusy(false);
    }
  };

  return (
    <Layout title="Attendance">
      <div className="attendance-page">

        <div className="loc-time-bar">
          <span>
            Location: {location || "Fetching location..."}
          </span>

          <span>
            Time: {liveTime}
          </span>
        </div>

        {locationError && (
          <p className="loc-error">
            {locationError}
          </p>
        )}

        {cameraError && (
          <p className="loc-error">
            {cameraError}
          </p>
        )}

        <div className="attendance-card">

          <h2>Selfie Attendance</h2>

          <p className="att-name">
            Employee: {userName} | Date: {today}
          </p>

          <div className="summary-grid">

            <div className="summary-pill">
              Total Work:{" "}
              {todaySummary?.totalWorkingMinutes
                ? `${todaySummary.totalWorkingMinutes} min`
                : "-"}
            </div>

            <div className="summary-pill">
              Break:{" "}
              {todaySummary?.breakMinutes
                ? `${todaySummary.breakMinutes} min`
                : "-"}
            </div>

            <div className="summary-pill">
              First In:{" "}
              {todaySummary?.firstPunchIn || "-"}
            </div>

            <div className="summary-pill">
              Final Out:{" "}
              {todaySummary?.finalPunchOut || "-"}
            </div>

          </div>

          <div className="today-chips">

            {todayRecord?.sessions?.some(
              (session) => session?.punchIn
            ) && (
              <span className="chip chip-in">
                First In:{" "}
                {todaySummary?.firstPunchIn || "-"}
              </span>
            )}

            {todayRecord?.sessions?.some(
              (session) => session?.punchOut
            ) && (
              <span className="chip chip-out">
                Final Out:{" "}
                {todaySummary?.finalPunchOut || "-"}
              </span>
            )}

            {todayRecord?.dayMode === "HALF_DAY" && (
              <span className="chip chip-half">
                Half Day
              </span>
            )}

            {todayRecord?.dayType === "Holiday" && (
              <span className="chip chip-holiday">
                Holiday
              </span>
            )}

            {todayRecord?.dayType === "Week Off" && (
              <span className="chip chip-weekoff">
                Week Off
              </span>
            )}

          </div>

          <div className="session-history">

            <h3>Session History</h3>

            {!todayRecord?.sessions?.length ? (
              <div className="empty-session">
                No sessions yet
              </div>
            ) : (
              <div className="session-list">

                {todayRecord.sessions
                  .slice()
                  .sort((a, b) =>
                    (a?.punchIn || "").localeCompare(
                      b?.punchIn || ""
                    )
                  )
                  .map((session, index) => (
                    <div
                      key={`${session.punchIn || ""}-${index}`}
                      className="session-item"
                    >

                      <div className="session-time">
                        <span className="session-tag">
                          In
                        </span>{" "}
                        {format12Hour(session.punchIn)}
                      </div>

                      <div className="session-time">
                        <span className="session-tag">
                          Out
                        </span>{" "}
                        {session.punchOut
                          ? format12Hour(session.punchOut)
                          : "Active"}
                      </div>

                    </div>
                  ))}

              </div>
            )}

          </div>

          <div className="camera-box">

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />

            <canvas
              ref={canvasRef}
              style={{ display: "none" }}
            />

            <div className="camera-overlay-info">

              <span>
                Location: {location}
              </span>

              <span>
                Live Time: {liveTime}
              </span>

            </div>

          </div>

          <div className="attendance-actions">

            <button
              type="button"
              onClick={handlePunchIn}
              disabled={punchBusy}
            >
              {punchBusy
                ? "Processing..."
                : "Punch In"}
            </button>

            <button
              type="button"
              onClick={handlePunchOut}
              disabled={punchBusy}
            >
              {punchBusy
                ? "Processing..."
                : "Punch Out"}
            </button>

            <button
              type="button"
              onClick={markHalfDay}
              disabled={punchBusy}
            >
              Half Day
            </button>

            <button
              type="button"
              onClick={markHoliday}
              disabled={punchBusy}
            >
              Holiday
            </button>

            <button
              type="button"
              onClick={markWeekOff}
              disabled={punchBusy}
            >
              Week Off
            </button>

          </div>

          {canSeeAll && (
            <div className="attendance-search">

              <input
                type="text"
                value={filterEmployee}
                onChange={(event) =>
                  setFilterEmployee(event.target.value)
                }
                placeholder="Search employee..."
              />

            </div>
          )}

          {loading ? (
            <div className="empty-row">
              Loading attendance...
            </div>
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
                      <td
                        colSpan={9}
                        className="empty-row"
                      >
                        No attendance found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map(
                      (item, index) => {

                        const normalized = item;
                        const sessions =
                          normalized.sessions || [];

                        const checkIn =
                          sessions.length > 0
                            ? sessions
                                .filter(
                                  (session) =>
                                    session.punchIn
                                )
                                .sort(
                                  (a, b) =>
                                    (
                                      a.punchIn || ""
                                    ).localeCompare(
                                      b.punchIn || ""
                                    )
                                )[0]?.punchIn
                            : normalized.punchIn || "";

                        const checkOut =
                          sessions.length > 0
                            ? sessions
                                .filter(
                                  (session) =>
                                    session.punchOut
                                )
                                .sort(
                                  (a, b) =>
                                    (
                                      a.punchOut || ""
                                    ).localeCompare(
                                      b.punchOut || ""
                                    )
                                )
                                .pop()?.punchOut
                            : normalized.punchOut || "";

                        let status = "-";

                        if (checkIn && checkOut) {
                          status = "Present";
                        } else if (checkIn) {
                          status = "Checked In";
                        } else if (
                          normalized.dayType ===
                          "Holiday"
                        ) {
                          status = "Holiday";
                        } else if (
                          normalized.dayType ===
                          "Week Off"
                        ) {
                          status = "Week Off";
                        } else if (
                          normalized.dayMode ===
                          "HALF_DAY"
                        ) {
                          status = "Half Day";
                        }

                        const loc =
                          normalized.location ||
                          normalized.checkInAddress ||
                          normalized.checkOutAddress ||
                          normalized.latestLiveAddress ||
                          "-";

                        const checkInSelfie =
                          sessions.find(
                            (session) =>
                              session?.punchInPhoto
                          )?.punchInPhoto ||
                          normalized.checkInSelfieUrl ||
                          normalized.checkInSelfiePath ||
                          normalized.checkInSelfiePhoto ||
                          "";

                        const checkOutSelfie =
                          sessions.find(
                            (session) =>
                              session?.punchOutPhoto
                          )?.punchOutPhoto ||
                          normalized.checkOutSelfieUrl ||
                          normalized.checkOutSelfiePath ||
                          normalized.checkOutSelfiePhoto ||
                          "";

                        return (
                          <tr key={index}>

                            <td>
                              {normalized.employeeName ||
                                "-"}
                            </td>

                            <td>
                              {normalized.date || "-"}
                            </td>

                            <td>
                              {format12Hour(checkIn)}
                            </td>

                            <td>
                              {format12Hour(checkOut)}
                            </td>

                            <td>
                              {calculateTotalHours(
                                checkIn,
                                checkOut
                              )}
                            </td>

                            <td>
                              <span
                                className={`status-badge ${status
                                  .toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  )}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td className="location-cell">
                              {loc}
                            </td>

                            <td>
                              {renderSelfieCell(
                                checkInSelfie
                              )}
                            </td>

                            <td>
                              {renderSelfieCell(
                                checkOutSelfie
                              )}
                            </td>

                          </tr>
                        );
                      }
                    )
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
