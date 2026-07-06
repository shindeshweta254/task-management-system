import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Attendance.css";

function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [photo, setPhoto] = useState("");
  const [location, setLocation] = useState("");
  const [attendance, setAttendance] = useState([]);

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("attendanceData")) || [];
    setAttendance(saved);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch(() => alert("Camera permission allow karo"));
  }, []);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setLocation(loc);
      },
      () => alert("Location permission allow karo")
    );
  };

  const takeSelfie = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = 220;
    canvas.height = 160;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 220, 160);

    setPhoto(canvas.toDataURL("image/png"));
  };

  const saveAttendance = (type) => {
    if (!photo) {
      alert("Pehle selfie lo");
      return;
    }

    if (!location) {
      alert("Pehle location lo");
      return;
    }

    const time = new Date().toLocaleTimeString();

    let oldData = JSON.parse(localStorage.getItem("attendanceData")) || [];

    const todayRecord = oldData.find((item) => item.date === today);

    if (type === "Punch In") {
      if (todayRecord?.punchIn) {
        alert("Aaj punch in already ho gaya");
        return;
      }

      oldData.push({
        date: today,
        punchIn: time,
        punchOut: "",
        location,
        photo,
        status: "Present",
      });
    }

    if (type === "Punch Out") {
      oldData = oldData.map((item) =>
        item.date === today ? { ...item, punchOut: time } : item
      );
    }

    localStorage.setItem("attendanceData", JSON.stringify(oldData));
    setAttendance(oldData);
    alert(`${type} successful`);
  };

  return (
    <Layout title="Attendance">
      <div className="attendance-page">
        <div className="attendance-card">
          <h2>Selfie Attendance</h2>

          <div className="camera-box">
            <video ref={videoRef} autoPlay></video>
            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          </div>

          {photo && <img src={photo} alt="selfie" className="selfie-img" />}

          <div className="attendance-actions">
            <button onClick={takeSelfie}>📸 Take Selfie</button>
            <button onClick={getLocation}>📍 Get Location</button>
            <button onClick={() => saveAttendance("Punch In")}>✅ Punch In</button>
            <button onClick={() => saveAttendance("Punch Out")}>🚪 Punch Out</button>
          </div>

          {location && <p className="location-text">Location: {location}</p>}
        </div>

        <div className="attendance-card">
          <h2>Daily Attendance</h2>

          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Status</th>
                <th>Selfie</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{item.punchIn}</td>
                  <td>{item.punchOut || "-"}</td>
                  <td>
                    <span className="present-badge">{item.status}</span>
                  </td>
                  <td>
                    <img src={item.photo} alt="selfie" className="table-img" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Attendance;