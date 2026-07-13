import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Attendance.css";

function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [location, setLocation] = useState("Fetching location...");
  const [locationError, setLocationError] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeName = user.name || "Employee";
  const userRole = user.role?.roleName || "EMPLOYEE";
  const isOwner = ["OWNER", "Owner/Admin", "DIRECTOR", "director", "MANAGER", "manager"].includes(userRole);

  const OFFICE_START = "10:15";
  const OFFICE_END = "18:00";
  const FULL_DAY_HOURS = 8;
  const HALF_DAY_HOURS = 4;
  const today = new Date().toLocaleDateString("en-IN");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("attendanceData")) || [];
    setAttendance(saved);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => alert("Camera permission allow karo"));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const addr = data.address;
            const parts = [addr.road || addr.neighbourhood || addr.suburb, addr.city || addr.town || addr.village || addr.county, addr.state].filter(Boolean);
            setLocation(parts.join(", ") || data.display_name);
          } catch { setLocation("Location fetch failed"); }
        },
        () => { setLocationError("Location permission denied"); setLocation("Unknown Location"); }
      );
    } else { setLocation("Geolocation not supported"); }
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const captureFromCamera = () => {
    const canvas = canvasRef.current, video = videoRef.current;
    if (!canvas || !video) return "";
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const getMinutes = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "-";
    const h = Math.floor(minutes / 60), m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h} hr ${m} min`;
  };

  const getDayType = () => new Date().getDay() === 0 ? "Week Off" : "Working Day";

  const calculateAttendance = (punchIn, punchOut, dayType, dayMode) => {
    if (dayType === "Holiday") return { workedHours: "-", lateBy: "-", earlyOut: "-", overtime: "-", status: "Holiday" };
    if (dayType === "Week Off") return { workedHours: "-", lateBy: "-", earlyOut: "-", overtime: "-", status: "Week Off" };
    if (dayMode === "HALF_DAY") return { workedHours: formatDuration(HALF_DAY_HOURS * 60), lateBy: "-", earlyOut: "-", overtime: "-", status: "Half Day" };
    if (!punchIn) return { workedHours: "-", lateBy: "-", earlyOut: "-", overtime: "-", status: "Absent" };

    const inMin = getMinutes(punchIn), startMin = getMinutes(OFFICE_START);
    if (!punchOut) {
      const lateMin = Math.max(0, inMin - startMin);
      return { workedHours: "-", lateBy: formatDuration(lateMin), earlyOut: "-", overtime: "-", status: lateMin > 0 ? `Late ${formatDuration(lateMin)}` : "Present" };
    }

    const outMin = getMinutes(punchOut), endMin = getMinutes(OFFICE_END);
    const workedMin = Math.max(0, outMin - inMin);
    const lateMin = Math.max(0, inMin - startMin);
    const earlyMin = Math.max(0, endMin - outMin);
    const overtimeMin = Math.max(0, workedMin - FULL_DAY_HOURS * 60);

    let status = "Present";
    if (workedMin < 240) status = "Absent";
    else if (workedMin < 480) status = "Half Day";
    else if (lateMin > 0) status = `Late ${formatDuration(lateMin)}`;

    return { workedHours: formatDuration(workedMin), lateBy: formatDuration(lateMin), earlyOut: formatDuration(earlyMin), overtime: formatDuration(overtimeMin), status };
  };

  const saveAttendance = (type) => {
    const capturedPhoto = captureFromCamera();
    const time = getCurrentTime();
    let oldData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    const todayRecord = oldData.find((i) => i.date === today && i.employeeName === employeeName);

    if (type === "Punch In") {
      if (todayRecord?.punchIn) { alert("Aaj punch in already ho gaya"); return; }
      oldData.push({ employeeName, date: today, location, punchIn: time, punchOut: "", punchInPhoto: capturedPhoto, punchOutPhoto: "", dayType: getDayType(), dayMode: "FULL_DAY" });
    }

    if (type === "Punch Out") {
      if (!todayRecord?.punchIn) { alert("Pehle punch in karo"); return; }
      if (todayRecord?.punchOut) { alert("Aaj punch out already ho gaya"); return; }
      oldData = oldData.map((i) =>
        i.date === today && i.employeeName === employeeName ? { ...i, punchOut: time, punchOutPhoto: capturedPhoto } : i
      );
    }

    localStorage.setItem("attendanceData", JSON.stringify(oldData));
    setAttendance([...oldData]);
    alert(`${type} successful ✅`);
  };

  const markHalfDay = () => {
    const capturedPhoto = captureFromCamera();
    let oldData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    const idx = oldData.findIndex((i) => i.date === today && i.employeeName === employeeName);
    if (idx !== -1) oldData[idx] = { ...oldData[idx], dayMode: "HALF_DAY", punchInPhoto: capturedPhoto, punchOutPhoto: "" };
    else oldData.push({ employeeName, date: today, location, punchIn: "", punchOut: "", punchInPhoto: capturedPhoto, punchOutPhoto: "", dayType: getDayType(), dayMode: "HALF_DAY" });
    localStorage.setItem("attendanceData", JSON.stringify(oldData));
    setAttendance([...oldData]);
    alert("Half Day marked 🕓");
  };

  const markHoliday = () => {
    let oldData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    const exists = oldData.find((i) => i.date === today && i.employeeName === employeeName);
    if (exists) oldData = oldData.map((i) => i.date === today && i.employeeName === employeeName ? { ...i, dayType: "Holiday", punchIn: "", punchOut: "", dayMode: "FULL_DAY" } : i);
    else oldData.push({ employeeName, date: today, location, punchIn: "", punchOut: "", punchInPhoto: "", punchOutPhoto: "", dayType: "Holiday", dayMode: "FULL_DAY" });
    localStorage.setItem("attendanceData", JSON.stringify(oldData));
    setAttendance([...oldData]);
    alert("Today marked as Holiday 🎉");
  };

  const markWeekOff = () => {
    let oldData = JSON.parse(localStorage.getItem("attendanceData")) || [];
    const exists = oldData.find((i) => i.date === today && i.employeeName === employeeName);
    if (exists) oldData = oldData.map((i) => i.date === today && i.employeeName === employeeName ? { ...i, dayType: "Week Off", punchIn: "", punchOut: "", dayMode: "FULL_DAY" } : i);
    else oldData.push({ employeeName, date: today, location, punchIn: "", punchOut: "", punchInPhoto: "", punchOutPhoto: "", dayType: "Week Off", dayMode: "FULL_DAY" });
    localStorage.setItem("attendanceData", JSON.stringify(oldData));
    setAttendance([...oldData]);
    alert("Today marked as Week Off 📅");
  };

  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});

  const clearOldAttendance = () => {
    if (!window.confirm("Sab attendance data delete hoga. Sure ho?")) return;
    localStorage.removeItem("attendanceData");
    setAttendance([]);
  };

  const deleteRecord = (idx) => {
    if (!window.confirm("Ye record delete karna chahte ho?")) return;
    const updated = attendance.filter((_, i) => i !== idx);
    localStorage.setItem("attendanceData", JSON.stringify(updated));
    setAttendance(updated);
  };

  const startEdit = (idx, item) => {
    setEditIndex(idx);
    setEditData({ ...item });
  };

  const saveEdit = () => {
    const updated = attendance.map((item, i) => i === editIndex ? { ...editData } : item);
    localStorage.setItem("attendanceData", JSON.stringify(updated));
    setAttendance(updated);
    setEditIndex(null);
    setEditData({});
  };

  const filteredAttendance = attendance.filter((item) =>
    isOwner
      ? (!filterEmployee.trim() || (item.employeeName || "").toLowerCase().includes(filterEmployee.trim().toLowerCase()))
      : item.employeeName === employeeName
  );

  const todayRecord = attendance.find((i) => i.date === today && i.employeeName === employeeName);

  return (
    <Layout title="Attendance">
      <div className="attendance-page">

        <div className="loc-time-bar">
          <span>📍 {location}</span>
          <span>🕐 {new Date().toLocaleTimeString("en-IN")}</span>
        </div>
        {locationError && <p className="loc-error">⚠️ {locationError}</p>}

        <div className="attendance-card">
          <h2>Selfie Attendance</h2>
          <p className="att-name">👤 {employeeName} &nbsp;|&nbsp; 📅 {today}</p>

          {todayRecord && (
            <div className="today-chips">
              {todayRecord.punchIn && <span className="chip chip-in">✅ In: {todayRecord.punchIn}</span>}
              {todayRecord.punchOut && <span className="chip chip-out">🚪 Out: {todayRecord.punchOut}</span>}
              {todayRecord.dayMode === "HALF_DAY" && <span className="chip chip-half">🕓 Half Day</span>}
              {todayRecord.dayType === "Holiday" && <span className="chip chip-holiday">🎉 Holiday</span>}
              {todayRecord.dayType === "Week Off" && <span className="chip chip-weekoff">📅 Week Off</span>}
            </div>
          )}

          <div className="camera-box">
            <video ref={videoRef} autoPlay playsInline muted></video>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
            <div className="camera-overlay-info">
              <span>📍 {location}</span>
              <span>🕐 {new Date().toLocaleTimeString("en-IN")}</span>
            </div>
          </div>

          {/* Today's photos */}
          {(todayRecord?.punchInPhoto || todayRecord?.punchOutPhoto) && (
            <div className="photos-row">
              {todayRecord.punchInPhoto && (
                <div className="photo-preview">
                  <p>Punch In Photo</p>
                  <img src={todayRecord.punchInPhoto} alt="punch-in" />
                </div>
              )}
              {todayRecord.punchOutPhoto && (
                <div className="photo-preview">
                  <p>Punch Out Photo</p>
                  <img src={todayRecord.punchOutPhoto} alt="punch-out" />
                </div>
              )}
            </div>
          )}

          <div className="pill-buttons">
            <button className="pill pill-green"  onClick={() => saveAttendance("Punch In")}>✅ Punch In</button>
            <button className="pill pill-orange" onClick={() => saveAttendance("Punch Out")}>🚪 Punch Out</button>
            <button className="pill pill-yellow" onClick={markHalfDay}>🕓 Half Day</button>
            <button className="pill pill-blue"   onClick={markHoliday}>🎉 Holiday</button>
            <button className="pill pill-purple" onClick={markWeekOff}>📅 Week Off</button>
            {isOwner && <button className="pill pill-red" onClick={clearOldAttendance}>🗑 Clear Data</button>}
          </div>
        </div>

        <div className="attendance-card">
          <h2>📊 {isOwner ? "All Employees Attendance" : "My Attendance"}</h2>

          {isOwner && (
            <input className="att-search" type="text" value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)} placeholder="🔍 Search employee..." />
          )}

          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Location</th>
                  <th>Punch In</th><th>In Photo</th>
                  <th>Punch Out</th><th>Out Photo</th>
                  <th>Worked</th><th>Late By</th><th>Early Out</th><th>Overtime</th><th>Status</th>
                  {isOwner && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0
                  ? <tr><td colSpan={isOwner ? 13 : 12} className="empty-row">No attendance found</td></tr>
                  : filteredAttendance.map((item, index) => {
                      const globalIndex = attendance.indexOf(item);
                      const result = calculateAttendance(item.punchIn, item.punchOut, item.dayType, item.dayMode);
                      const sc = result.status.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "");
                      const isEditing = editIndex === globalIndex;
                      return (
                        <tr key={index}>
                          <td>{item.employeeName}</td>
                          <td>{isEditing ? <input className="edit-input" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} /> : item.date}</td>
                          <td className="location-cell">{item.location || "-"}</td>
                          <td>{isEditing ? <input className="edit-input" value={editData.punchIn} onChange={(e) => setEditData({...editData, punchIn: e.target.value})} placeholder="HH:MM" /> : (item.punchIn || "-")}</td>
                          <td>{item.punchInPhoto ? <img src={item.punchInPhoto} alt="in" className="table-img" /> : "-"}</td>
                          <td>{isEditing ? <input className="edit-input" value={editData.punchOut} onChange={(e) => setEditData({...editData, punchOut: e.target.value})} placeholder="HH:MM" /> : (item.punchOut || "-")}</td>
                          <td>{item.punchOutPhoto ? <img src={item.punchOutPhoto} alt="out" className="table-img" /> : "-"}</td>
                          <td>{result.workedHours}</td>
                          <td>{result.lateBy}</td>
                          <td>{result.earlyOut}</td>
                          <td>{result.overtime}</td>
                          <td><span className={`badge badge-${sc}`}>{result.status}</span></td>
                          {isOwner && (
                            <td>
                              {isEditing
                                ? <><button className="act-btn act-save" onClick={saveEdit}>💾 Save</button><button className="act-btn act-cancel" onClick={() => setEditIndex(null)}>✖ Cancel</button></>
                                : <><button className="act-btn act-edit" onClick={() => startEdit(globalIndex, item)}>✏️ Edit</button><button className="act-btn act-del" onClick={() => deleteRecord(globalIndex)}>🗑 Delete</button></>
                              }
                            </td>
                          )}
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Attendance;
