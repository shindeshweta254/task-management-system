import { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./attendance.css";
import { useAttendance } from "../../hooks/useAttendance";
import { fetchMySiteTeam } from "../../api/userApi";
import { getAuthHeaders } from "../../api/index";

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

async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );

    const data = await res.json();
    const addr = data.address || {};

    const parts = [
      addr.road || addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.village || addr.county,
      addr.state,
    ].filter(Boolean);

    return parts.join(", ") || data.display_name || `${latitude}, ${longitude}`;
  } catch (error) {
    console.warn("Reverse geocode failed:", error);
    return `${latitude}, ${longitude}`;
  }
}
function Attendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const teamVideoRef = useRef(null);
  const teamCanvasRef = useRef(null);

  const profileVideoRef = useRef(null);
  const profileCanvasRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraError, setCameraError] = useState("");
  const [punchBusy, setPunchBusy] = useState(false);

  // Supervisor Team Attendance
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [teamAttendanceOpen, setTeamAttendanceOpen] = useState(false);
  const [registerPhotoOpen, setRegisterPhotoOpen] = useState(false);
  const [registeredEmployeesOpen, setRegisteredEmployeesOpen] = useState(false);
  const [attendanceRecordsOpen, setAttendanceRecordsOpen] = useState(false);
  const [teamDailyRecords, setTeamDailyRecords] = useState([]);
  const [attendancePreviewPhoto, setAttendancePreviewPhoto] = useState("");
  const [attendanceRecordDate, setAttendanceRecordDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [registeredProfiles, setRegisteredProfiles] = useState([]);
  const [registeredProfilesBusy, setRegisteredProfilesBusy] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [profilePhotoBlob, setProfilePhotoBlob] = useState(null);
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [teamEmployees, setTeamEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [teamPhoto, setTeamPhoto] = useState(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamHistory, setTeamHistory] = useState([]);

  // Payment-style attendance success popup
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [successText, setSuccessText] = useState("Attendance Successful");

  const {
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
    let cancelled = false;

    // Create Employee Profile open hai to personal camera release rahega.
    if (registerPhotoOpen || teamAttendanceOpen || registeredEmployeesOpen || attendanceRecordsOpen) {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());

        videoRef.current.srcObject = null;
      }

      return;
    }

    const startPersonalCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera is not supported on this device.");
          return;
        }

        const cameraStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user"
            },
            audio: false
          });

        if (cancelled) {
          cameraStream
            .getTracks()
            .forEach((track) => track.stop());
          return;
        }

        stream = cameraStream;

        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
          await videoRef.current.play().catch(() => {});
        }

        setCameraError("");
      } catch (error) {
        console.error("Personal camera error:", error);
        setCameraError("Camera permission allow karo.");
      }
    };

    startPersonalCamera();

    return () => {
      cancelled = true;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [registerPhotoOpen, teamAttendanceOpen, registeredEmployeesOpen, attendanceRecordsOpen]);

  useEffect(() => {
    let profileStream = null;
    let cancelled = false;

    if (!registerPhotoOpen || !selectedEmployeeId) return;

    const waitForProfileVideo = async () => {
      for (let i = 0; i < 30; i++) {
        if (profileVideoRef.current) {
          return profileVideoRef.current;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return null;
    };

    const startProfileCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera is not supported on this device.");
          return;
        }

        // Register panel/video ko DOM me render hone do.
        const video = await waitForProfileVideo();

        if (cancelled) {
          return;
        }

        if (!video) {
          console.error("Register video element not ready.");
          setCameraError("Register camera screen ready nahi hua.");
          return;
        }

        // Personal camera ko release hone ke liye thoda time.
        await new Promise((resolve) => setTimeout(resolve, 700));

        if (cancelled) return;

        profileStream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });

        if (cancelled) {
          profileStream
            .getTracks()
            .forEach((track) => track.stop());
          return;
        }

        video.srcObject = profileStream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        await video.play();

        console.log(
          "REGISTER CAMERA READY:",
          video.videoWidth,
          video.videoHeight,
          video.readyState
        );

        setCameraError("");

      } catch (error) {
        console.error(
          "REGISTER CAMERA ERROR:",
          error?.name,
          error?.message,
          error
        );

        setCameraError(
          "Register camera open nahi ho raha."
        );
      }
    };

    startProfileCamera();

    return () => {
      cancelled = true;

      if (profileStream) {
        profileStream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [registerPhotoOpen, selectedEmployeeId]);
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

  const playAttendanceSuccessSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.22,
        ctx.currentTime + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.55
      );

      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.16);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.log("Success sound unavailable:", e);
    }
  };
  useEffect(() => {
    let stream = null;
    let cancelled = false;

    const startTeamCamera = async () => {
      if (!teamAttendanceOpen) return;

      try {
        setCameraError("");

        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera is not supported on this device.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Wait until Team Attendance video is mounted.
        for (let i = 0; i < 30; i++) {
          if (teamVideoRef.current) break;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const video = teamVideoRef.current;

        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          setCameraError("Team attendance camera screen ready nahi hua.");
          return;
        }

        video.srcObject = stream;

        await video.play().catch((error) => {
          console.log("Team camera play error:", error);
        });

      } catch (error) {
        console.error("Team attendance camera error:", error);
        setCameraError(
          "Camera open nahi hua. Camera permission allow kijiye."
        );
      }
    };

    startTeamCamera();

    return () => {
      cancelled = true;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (teamVideoRef.current?.srcObject) {
        teamVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());

        teamVideoRef.current.srcObject = null;
      }
    };
  }, [teamAttendanceOpen]);

  const captureTeamPhotoBlob = async () => {
    const video = teamVideoRef.current;

    if (!video) {
      throw new Error("Team attendance camera available nahi hai.");
    }

    await video.play().catch(() => {});

    let attempts = 0;

    while (
      (video.readyState < 2 ||
        !video.videoWidth ||
        !video.videoHeight) &&
      attempts < 40
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Camera ready nahi hua. Please try again.");
    }

    let canvas = teamCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Camera photo capture failed.");
    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Camera photo create nahi hua."));
          }
        },
        "image/jpeg",
        0.9
      );
    });

    return blob;
  };

  const captureProfilePhoto = async () => {
    const video = profileVideoRef.current;
    const canvas = profileCanvasRef.current;

    if (!video || !canvas) {
      alert("Camera available nahi hai.");
      return;
    }

    try {
      await video.play().catch(() => {});

      let attempts = 0;

      while (
        (video.readyState < 2 ||
          !video.videoWidth ||
          !video.videoHeight) &&
        attempts < 40
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        alert("Camera open nahi hua. Camera permission check karo.");
        return;
      }

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        alert("Photo capture failed.");
        return;
      }

      context.drawImage(
        video,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("Photo capture failed.");
            return;
          }

          setProfilePhotoBlob(blob);
          setProfilePhotoPreview(
            URL.createObjectURL(blob)
          );
        },
        "image/jpeg",
        0.9
      );

    } catch (error) {
      console.error("Profile capture error:", error);
      alert("Photo capture failed.");
    }
  };

  const deleteTeamAttendanceRecord = async (attendanceId) => {
    const confirmed = window.confirm(
      "Is attendance record ko delete karna hai?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/${attendanceId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Attendance delete failed");
      }

      setTeamDailyRecords((records) =>
        records.filter(
          (record) =>
            String(record.id || record.attendanceId) !==
            String(attendanceId)
        )
      );

      playAttendanceSuccessSound();
      setSuccessText("Attendance Deleted");
      setAttendanceSuccess(true);

      setTimeout(() => {
        setAttendanceSuccess(false);
      }, 1500);

    } catch (error) {
      console.error("Attendance delete error:", error);
      alert(error?.message || "Attendance delete failed");
    }
  };
  const loadRegisteredProfiles = async () => {
    setRegisteredProfilesBusy(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/profile-photos`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Registered employees load failed");
      }

      const data = await response.json();

      setRegisteredProfiles(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error("Registered profiles error:", error);
      alert(error?.message || "Registered employees load failed");
    } finally {
      setRegisteredProfilesBusy(false);
    }
  };
  const saveEmployeeProfilePhoto = async () => {
    if (!selectedEmployeeId) {
      alert("Select Employee first");
      return;
    }

    if (!profilePhotoBlob) {
      alert("Capture employee photo first");
      return;
    }

    setProfileSaveBusy(true);

    try {
      const formData = new FormData();

      formData.append(
        "photo",
        profilePhotoBlob,
        "employee-profile.jpg"
      );

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/profile-photo/${selectedEmployeeId}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Profile photo save failed");
      }

      playAttendanceSuccessSound();
      setSuccessText("Profile Photo Saved");
      setAttendanceSuccess(true);

      setTimeout(() => {
        setAttendanceSuccess(false);
      }, 1800);

    } catch (error) {
      console.error("Profile photo save error:", error);
      alert(error?.message || "Profile photo save failed");
    } finally {
      setProfileSaveBusy(false);
    }
  };
  const deleteRegisteredProfile = async (employeeId) => {
    const ok = window.confirm(
      "Registered profile photo delete karna hai?"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/profile-photo/${employeeId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Delete failed");
      }

      await loadRegisteredProfiles();

      playAttendanceSuccessSound();
      setSuccessText("Profile Photo Deleted");
      setAttendanceSuccess(true);

      setTimeout(() => {
        setAttendanceSuccess(false);
      }, 1600);

    } catch (error) {
      console.error("Delete profile error:", error);
      alert(error?.message || "Delete failed");
    }
  };
  const handleTeamPunch = async (type) => {
    if (!selectedEmployeeId || teamBusy) return;

    setTeamBusy(true);

    try {
      const photoBlob = await captureTeamPhotoBlob();

      let liveLatitude = "";
      let liveLongitude = "";
      let liveLocation = "";

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
              }
            )
          );

          liveLatitude = String(position.coords.latitude);
          liveLongitude = String(position.coords.longitude);

          // Fresh GPS coordinates se fresh address nikalo.
          liveLocation = await reverseGeocode(
            Number(liveLatitude),
            Number(liveLongitude)
          );



          console.log(
            "TEAM ATTENDANCE LIVE LOCATION ->",
            liveLocation,
            liveLatitude,
            liveLongitude
          );

        } catch (gpsError) {
          console.error("Team attendance GPS unavailable:", gpsError);
          throw new Error(
            "Current location nahi mili. Location/GPS permission ON karke dobara try kijiye."
          );
        }
      } else {
        throw new Error("Is device me location service available nahi hai.");
      }

      const formData = new FormData();
      formData.append("photo", photoBlob, "team-attendance.jpg");
      formData.append("location", liveLocation || "");
      formData.append("latitude", liveLatitude);
      formData.append("longitude", liveLongitude);

      const url =
        type === "in"
          ? `${API_BASE_URL}/api/attendance/supervisor/punch-in/${selectedEmployeeId}`
          : `${API_BASE_URL}/api/attendance/supervisor/punch-out/${selectedEmployeeId}`;

      const res = await fetch(url, {
        method: type === "in" ? "POST" : "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Attendance failed");
      }

      setSuccessText(
        type === "in"
          ? "Punch In Successful"
          : "Punch Out Successful"
      );
      setAttendanceSuccess(true);

      setTimeout(() => {
        setAttendanceSuccess(false);
      }, 1800);

    } catch (error) {
      console.error("Team attendance error:", error);
      alert(error?.message || "Team attendance failed");
    } finally {
      setTeamBusy(false);
    }
  };
  const handleTeamStatus = async (status) => {
    if (!selectedEmployeeId || teamBusy) return;

    setTeamBusy(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/status/${selectedEmployeeId}`,
        {
          method: "PUT",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            status,
            location: location || "",
          }),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Status update failed");
      }

      setSuccessText(
        status === "HALF_DAY"
          ? "Half Day Marked"
          : status === "WEEK_OFF"
          ? "Week Off Marked"
          : status === "HOLIDAY"
          ? "Holiday Marked"
          : "Attendance Updated"
      );

      playAttendanceSuccessSound();
      setAttendanceSuccess(true);

      setTimeout(() => {
        setAttendanceSuccess(false);
      }, 1800);

    } catch (error) {
      console.error("Team attendance status error:", error);
      alert(error?.message || "Status update failed");
    } finally {
      setTeamBusy(false);
    }
  };

  const loadTeamHistory = async () => {
    if (!selectedEmployeeId) {
      alert("Select Employee first");
      return;
    }

    setTeamBusy(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/attendance/supervisor/history/${selectedEmployeeId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "History load failed");
      }

      const data = await res.json();
      setTeamHistory(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Team attendance history error:", error);
      alert(error?.message || "History load failed");
    } finally {
      setTeamBusy(false);
    }
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
      {attendanceSuccess && (
        <div className="attendance-success-overlay">
          <div className="attendance-success-box">
            <div className="attendance-success-circle"><span className="attendance-success-check"></span></div>
            <h2>{successText}</h2>
            <p>Attendance Successful</p>
          </div>
        </div>
      )}
      <div className={`attendance-page ${(registerPhotoOpen || registeredEmployeesOpen || teamAttendanceOpen || attendanceRecordsOpen) ? "profile-page-active" : ""}`}>

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

        {["SUPERVISOR", "DIRECTOR", "OWNER/ADMIN", "OWNER", "ADMIN"].includes(String(userRole || "").toUpperCase()) && (
  <div className="team-attendance-tools">
    <button
      type="button"
      className="team-menu-btn"
      onClick={() => setTeamMenuOpen(!teamMenuOpen)}
    >
      <span className="team-menu-dots">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    {teamMenuOpen ? (
      <div className="team-menu-dropdown">
        <button
          type="button"
          onClick={async () => {
            const data = await fetchMySiteTeam();
            setTeamEmployees(Array.isArray(data) ? data : []);
            setSelectedEmployeeId("");
            setProfilePhotoPreview("");
            setProfilePhotoBlob(null);
            setRegisterPhotoOpen(true);
            setTeamAttendanceOpen(false);
            setTeamMenuOpen(false);
          }}
        >
          Create Employee Profile
        </button>

        <button
          type="button"
          onClick={async () => {
            setTeamMenuOpen(false);
            setRegisterPhotoOpen(false);
            setTeamAttendanceOpen(false);
            setRegisteredEmployeesOpen(true);
            await loadRegisteredProfiles();
          }}
        >
          All Profiles
        </button>

        <button
          type="button"
          onClick={async () => {
            const data = await fetchMySiteTeam();
            setTeamEmployees(Array.isArray(data) ? data : []);
            setTeamAttendanceOpen(true);
            setTeamMenuOpen(false);
          }}
        >
          Mark Team Attendance
        </button>

        <button
          type="button"
          onClick={async () => {
            setRegisterPhotoOpen(false);
            setRegisteredEmployeesOpen(false);
            setTeamAttendanceOpen(false);
            setAttendanceRecordsOpen(true);
            setTeamMenuOpen(false);
            setTeamBusy(true);

            try {
              const response = await fetch(
                `${API_BASE_URL}/api/attendance/my-site`,
                {
                  headers: getAuthHeaders(),
                }
              );

              if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Attendance records load failed");
              }

              const data = await response.json();
              setTeamDailyRecords(Array.isArray(data) ? data : []);
            } catch (error) {
              console.error("Team daily attendance error:", error);
              alert(error?.message || "Attendance records load failed");
            } finally {
              setTeamBusy(false);
            }
          }}
        >
          Attendance Records
        </button>
      </div>
    ) : null}
  </div>
)}

{attendanceRecordsOpen && (
  <div className="team-attendance-panel attendance-records-page">

    <div className="team-attendance-panel-head">
      <div>
        <h2>Team Attendance Records</h2>
        <p>Daily attendance of all employees in your team.</p>
      </div>

      <button
        type="button"
        className="team-close-btn"
        onClick={() => {
          setAttendanceRecordsOpen(false);
          setAttendancePreviewPhoto("");
        }}
      >
        X
      </button>
    </div>

    <div className="team-record-toolbar">
      <label>
        <b>Date:</b>
        <input
          type="date"
          value={attendanceRecordDate}
          onChange={(e) =>
            setAttendanceRecordDate(e.target.value)
          }
        />
      </label>

      <b>
        Total:{" "}
        {
          teamDailyRecords.filter(
            (item) =>
              String(
                item.attendanceDate ||
                item.date ||
                ""
              ).slice(0, 10) === attendanceRecordDate
          ).length
        }
      </b>
    </div>

    {teamBusy ? (
      <p>Loading...</p>
    ) : (() => {

      const makePhotoUrl = (value) => {
        if (!value) return "";

        const photo =
          String(value).replace(/\\/g, "/");

        if (
          photo.startsWith("http://") ||
          photo.startsWith("https://") ||
          photo.startsWith("data:") ||
          photo.startsWith("blob:")
        ) {
          return photo;
        }

        return `${API_BASE_URL}/${photo.replace(/^\/+/, "")}`;
      };

      const records = teamDailyRecords
        .filter((item) =>
          String(
            item.attendanceDate ||
            item.date ||
            ""
          ).slice(0, 10) === attendanceRecordDate
        )
        .sort((a, b) =>
          String(a.user?.name || a.employeeName || "")
            .localeCompare(
              String(b.user?.name || b.employeeName || "")
            )
        );

      if (!records.length) {
        return <p>No attendance found for selected date.</p>;
      }

      return (
        <div className="team-record-table-wrap">
          <table className="team-record-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>In</th>
                <th>In Selfie</th>
                <th>Out</th>
                <th>Out Selfie</th>
                <th>Total</th>
                <th>Extra / Less</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {records.map((item) => {
                const emp = item.user || {};

                const name =
                  emp.name ||
                  item.employeeName ||
                  "Employee";

                const employeeId =
                  emp.employeeId ||
                  item.employeeId ||
                  "-";

                const inPhoto = makePhotoUrl(
                  item.checkInSelfieUrl ||
                  item.checkInSelfiePath ||
                  item.checkInSelfiePhoto
                );

                const outPhoto = makePhotoUrl(
                  item.checkOutSelfieUrl ||
                  item.checkOutSelfiePath ||
                  item.checkOutSelfiePhoto
                );

                const hours =
                  item.workingHours != null
                    ? Number(item.workingHours)
                    : null;

                let extraLess = "-";

                if (hours != null) {
                  const difference = hours - 8;
                  const mins =
                    Math.round(Math.abs(difference) * 60);

                  const h = Math.floor(mins / 60);
                  const m = mins % 60;

                  extraLess =
                    difference > 0
                      ? `+${h}h ${m}m`
                      : difference < 0
                        ? `-${h}h ${m}m`
                        : "0m";
                }

                return (
                  <tr key={item.id || item.attendanceId}>
                    <td>
                      <b>{name}</b>
                      <small>{employeeId}</small>
                    </td>

                    <td>{item.status || "-"}</td>

                    <td>
                      {format12Hour(item.checkInTime)}
                    </td>

                    <td>
                      {inPhoto ? (
                        <img
                          className="team-record-thumb"
                          src={inPhoto}
                          alt="Punch In"
                          onClick={() =>
                            setAttendancePreviewPhoto(inPhoto)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {format12Hour(item.checkOutTime)}
                    </td>

                    <td>
                      {outPhoto ? (
                        <img
                          className="team-record-thumb"
                          src={outPhoto}
                          alt="Punch Out"
                          onClick={() =>
                            setAttendancePreviewPhoto(outPhoto)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {hours != null
                        ? `${hours.toFixed(2)}h`
                        : "-"}
                    </td>

                    <td>{extraLess}</td>

                    <td className="team-record-location-cell">
                      {item.location || "-"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="team-record-delete"
                        onClick={() =>
                          deleteTeamAttendanceRecord(
                            item.id || item.attendanceId
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    })()}

    {attendancePreviewPhoto && (
      <div
        className="attendance-photo-modal"
        onClick={() =>
          setAttendancePreviewPhoto("")
        }
      >
        <div
          className="attendance-photo-modal-box"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              setAttendancePreviewPhoto("")
            }
          >
            X
          </button>

          <img
            src={attendancePreviewPhoto}
            alt="Attendance Selfie Preview"
          />
        </div>
      </div>
    )}

  </div>
)}
{registeredEmployeesOpen && (
  <div className="team-attendance-panel all-profiles-page">
    <div className="team-attendance-panel-head">
      <div>
        <h2>All Profiles</h2>
        <p>Saved employee profile photos.</p>
      </div>

      <button
        type="button"
        className="team-close-btn"
        onClick={() => setRegisteredEmployeesOpen(false)}
      >
        X
      </button>
    </div>

    {registeredProfilesBusy ? (
      <p>Loading...</p>
    ) : registeredProfiles.length === 0 ? (
      <p>No registered employees found.</p>
    ) : (
      <div className="registered-profile-grid">
        {registeredProfiles.map((profile) => {
          const emp = profile.user || {};
          const photoPath =
            profile.referencePhotoPath || "";

          const photoUrl = photoPath
            ? `${API_BASE_URL}/${String(photoPath).replace(/^\/+/, "")}`
            : "";

          return (
            <div
              className="registered-profile-card"
              key={profile.id}
            >
              <div className="registered-profile-photo">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={emp.name || "Employee"}
                  />
                ) : (
                  <div className="registered-no-photo">
                    No Photo
                  </div>
                )}
              </div>

              <div className="registered-profile-info">
                <h3>{emp.name || "-"}</h3>
                <p>
                  <b>ID:</b> {emp.employeeId || "-"}
                </p>
                <p>
                  <b>Site:</b> {emp.siteCode || "-"}
                </p>
              </div>

              <div className="registered-profile-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (photoUrl) {
                      window.open(photoUrl, "_blank");
                    }
                  }}
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId(
                      String(emp.id || "")
                    );
                    setProfilePhotoBlob(null);
                    setProfilePhotoPreview("");
                    setRegisteredEmployeesOpen(false);
                    setRegisterPhotoOpen(true);
                  }}
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteRegisteredProfile(emp.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
{registerPhotoOpen && (
  <div className="team-attendance-panel create-profile-page">

    <div className="team-attendance-panel-head">
      <div>
        <h2>Create Employee Profile</h2>
        <p>Select employee and capture a clear profile photo.</p>
      </div>

      <button
        type="button"
        className="team-close-btn"
        onClick={() => {
          setRegisterPhotoOpen(false);
          setProfilePhotoPreview("");
          setProfilePhotoBlob(null);
        }}
      >
        X
      </button>
    </div>

    <select
      className="team-employee-select"
      value={selectedEmployeeId}
      onChange={(event) => {
        setSelectedEmployeeId(event.target.value);
        setProfilePhotoPreview("");
        setProfilePhotoBlob(null);
      }}
    >
      <option value="">Select Employee</option>

      {teamEmployees.map((emp) => (
        <option key={emp.id} value={emp.id}>
          {emp.name || emp.employeeName || emp.employeeId}
        </option>
      ))}
    </select>

    {selectedEmployeeId && (
      <>
        <div className="profile-register-camera-box">
          <h3>Live Camera</h3>

          <video
            ref={profileVideoRef}
            autoPlay
            muted
            playsInline
            className="profile-register-video"
          />

          <canvas
            ref={profileCanvasRef}
            style={{ display: "none" }}
          />

          {profilePhotoPreview && (
            <div className="profile-photo-preview">
              <p>Captured Profile Photo</p>

              <img
                src={profilePhotoPreview}
                alt="Employee profile"
              />
            </div>
          )}
        </div>

        <div className="profile-camera-controls">

          {!profilePhotoBlob ? (
            <button
              type="button"
              className="profile-camera-shutter"
              onClick={captureProfilePhoto}
              disabled={profileSaveBusy}
              aria-label="Take photo"
            >
              <span></span>
            </button>
          ) : (
            <div className="profile-after-capture">

              <button
                type="button"
                className="profile-retake-btn"
                disabled={profileSaveBusy}
                onClick={() => {
                  setProfilePhotoBlob(null);
                  setProfilePhotoPreview("");
                }}
              >
                Retake
              </button>

              <button
                type="button"
                className="profile-save-btn"
                disabled={profileSaveBusy}
                onClick={saveEmployeeProfilePhoto}
              >
                {profileSaveBusy
                  ? "Saving..."
                  : "Save Profile Photo"}
              </button>

            </div>
          )}

        </div>
      </>
    )}

  </div>
)}
{teamAttendanceOpen && (
          <div className="team-attendance-panel mark-team-attendance-page">
            <div className="team-attendance-panel-head">
              <div>
                <h2>Team Attendance</h2>
                <p>Select employee and capture live attendance photo.</p>
              </div>

              <button
                type="button"
                className="team-close-btn"
                onClick={() => setTeamAttendanceOpen(false)}
              > X </button>
            </div>

            <select
              className="team-employee-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Select Employee</option>
              {teamEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.employeeName || emp.employeeId}
                </option>
              ))}
            </select>

            <div className="team-live-camera-box">
              <h3>Live Attendance Camera</h3>

              <video
                ref={teamVideoRef}
                autoPlay
                muted
                playsInline
                className="team-live-camera-video"
              />

              <div className="team-camera-status">
                {selectedEmployeeId
                  ? "Face camera ke samne rakhiye"
                  : "Pehle employee select kijiye"}
              </div>
            </div>

            <div className="team-attendance-note">
              Employee select karo, phir live camera se Punch In ya Punch Out photo capture hoga.
            </div>

            <div className="team-attendance-actions">
              <button
                type="button"
                disabled={!selectedEmployeeId || teamBusy}
                onClick={() => handleTeamPunch("in")}
              >
                {teamBusy ? "Processing..." : "Punch In"}
              </button>

              <button
                type="button"
                disabled={!selectedEmployeeId || teamBusy}
                onClick={() => handleTeamPunch("out")}
              >
                {teamBusy ? "Processing..." : "Punch Out"}
              </button>
            </div>
          </div>
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

