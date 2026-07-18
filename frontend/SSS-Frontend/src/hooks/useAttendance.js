import { useCallback, useEffect, useMemo, useState } from "react";
import { computeSessionsSummary, normalizeAttendanceRecord, upsertSessionForSameDay } from "../utils/attendanceUtils";

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

function isPrivilegedRole(roleName) {
  const r = String(roleName || "").toUpperCase();
  return ["OWNER", "ADMIN", "OWNER/ADMIN", "DIRECTOR"].includes(r) || r === "OWNER/ADMIN";
}

function isAuthorizedManager(roleName) {
  // Keep existing behavior minimal: managers are treated as privileged if already existing UI treated them as owner.
  const r = String(roleName || "").toUpperCase();
  return r === "MANAGER" || r === "MANAGER/SUPERVISOR";
}

export function useAttendance() {
  const user = useMemo(() => getUserFromStorage(), []);
  const userId = user?.id; // numeric primary key required by requirement
  const userName = user?.name || "Employee";
  const userRole = user?.role?.roleName || "EMPLOYEE";

  const canSeeAll = isPrivilegedRole(userRole) || isAuthorizedManager(userRole);
  const [filterEmployee, setFilterEmployee] = useState("");

  const [location, setLocation] = useState("Fetching location...");
  const [locationError, setLocationError] = useState("");

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState("");

  const today = useMemo(() => new Date().toLocaleDateString("en-IN"), []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("attendanceData")) || [];
      setAttendance(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Location acquisition kept in hook to keep page smaller.
  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocation("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
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
          setLocation(parts.join(", ") || data.display_name || "Unknown Location");
        } catch {
          setLocation("Location fetch failed");
        }
      },
      () => {
        setLocationError("Location permission denied");
        setLocation("Unknown Location");
      }
    );
  }, []);

  const persist = useCallback((nextAttendance) => {
    setAttendance(nextAttendance);
    try {
      localStorage.setItem("attendanceData", JSON.stringify(nextAttendance));
    } catch (e) {
      // swallow to keep UI working
    }
  }, []);

  const filteredAttendance = useMemo(() => {
    const normalized = attendance.map(normalizeAttendanceRecord);

    if (!canSeeAll) {
      // Requirement: EMPLOYEE/SUPERVISOR must see only their own attendance using localStorage user.id.
      // Existing data uses employeeName; we keep compatibility by also trying to match id if present.
      return normalized.filter((item) => {
        const itemUserId = item?.userId;
        return itemUserId != null ? itemUserId === userId : item.employeeName === userName;
      });
    }

    // Owner/Manager can filter by employeeName.
    const q = filterEmployee.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((item) => (item.employeeName || "").toLowerCase().includes(q));
  }, [attendance, canSeeAll, filterEmployee, userId, userName]);

  const todayRecord = useMemo(() => {
    const normalized = filteredAttendance;
    // For non-privileged, filteredAttendance already matches current employee.
    return normalized.find((r) => r.date === today && r.employeeName === userName) || normalized.find((r) => r.date === today);
  }, [filteredAttendance, today, userName]);

  const OFFICE_START = "10:15";
  const OFFICE_END = "18:00";

  const todaySummary = useMemo(() => {
    const rec = todayRecord ? normalizeAttendanceRecord(todayRecord) : null;
    const dayType = rec?.dayType || "Working Day";
    const dayMode = rec?.dayMode || "FULL_DAY";
    return computeSessionsSummary({
      sessions: rec?.sessions || [],
      officeStart: OFFICE_START,
      officeEnd: OFFICE_END,
      fullDayHours: 8,
      halfDayHours: 4,
      dayType,
      dayMode,
    });
  }, [todayRecord]);

  const getCurrentTimeHHMM = useCallback(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, []);

  const markHalfDay = useCallback(() => {
    const nowTime = getCurrentTimeHHMM();
    const photoPlaceholder = "";

    const captured = { time: nowTime, photo: photoPlaceholder };

    const next = attendance.map(normalizeAttendanceRecord);
    const idx = next.findIndex((i) => i.date === today && i.employeeName === userName);

    const base = idx !== -1 ? next[idx] : {
      employeeName: userName,
      userId,
      date: today,
      location,
      punchIn: "",
      punchOut: "",
      punchInPhoto: "",
      punchOutPhoto: "",
      dayType: recDayTypeDefault(),
      dayMode: "FULL_DAY",
      sessions: [],
    };

    const updated = {
      ...base,
      location,
      dayMode: "HALF_DAY",
      punchInPhoto: base.punchInPhoto,
      punchOutPhoto: base.punchOutPhoto,
    };

    if (idx !== -1) next[idx] = updated;
    else next.push(updated);
    persist(next);
  }, [attendance, getCurrentTimeHHMM, location, persist, today, userId, userName]);

  const recDayTypeDefault = () => "Working Day";

  const markHoliday = useCallback(() => {
    const next = attendance.map(normalizeAttendanceRecord);
    const idx = next.findIndex((i) => i.date === today && i.employeeName === userName);

    const base = idx !== -1 ? next[idx] : {
      employeeName: userName,
      userId,
      date: today,
      location,
      dayType: "Working Day",
      dayMode: "FULL_DAY",
      sessions: [],
      punchIn: "",
      punchOut: "",
    };

    const updated = {
      ...base,
      location,
      dayType: "Holiday",
      dayMode: "FULL_DAY",
    };

    if (idx !== -1) next[idx] = updated;
    else next.push(updated);
    persist(next);
  }, [attendance, location, persist, today, userId, userName]);

  const markWeekOff = useCallback(() => {
    const next = attendance.map(normalizeAttendanceRecord);
    const idx = next.findIndex((i) => i.date === today && i.employeeName === userName);

    const base = idx !== -1 ? next[idx] : {
      employeeName: userName,
      userId,
      date: today,
      location,
      dayType: "Working Day",
      dayMode: "FULL_DAY",
      sessions: [],
      punchIn: "",
      punchOut: "",
    };

    const updated = {
      ...base,
      location,
      dayType: "Week Off",
      dayMode: "FULL_DAY",
    };

    if (idx !== -1) next[idx] = updated;
    else next.push(updated);
    persist(next);
  }, [attendance, location, persist, today, userId, userName]);

  const clearData = useCallback(() => {
    if (!window.confirm("Sab attendance data delete hoga. Sure ho?")) return;
    localStorage.removeItem("attendanceData");
    setAttendance([]);
  }, []);

  const punchIn = useCallback(
    (photo) => {
      const time = getCurrentTimeHHMM();

      const next = attendance.map(normalizeAttendanceRecord);
      const idx = next.findIndex((i) => i.date === today && i.employeeName === userName);

      const base = idx !== -1 ? next[idx] : {
        employeeName: userName,
        userId,
        date: today,
        location,
        dayType: "Working Day",
        dayMode: "FULL_DAY",
        sessions: [],
        punchIn: "",
        punchOut: "",
        punchInPhoto: "",
        punchOutPhoto: "",
      };

      const updated = upsertSessionForSameDay({
        record: base,
        newSession: { type: "Punch In", time, photo, createdAt: Date.now() },
      });

      // keep legacy top-level punchIn/punchOut if needed (first/last)
      const sessions = updated.sessions || [];
      const firstIn = sessions
        .filter((s) => s.punchIn)
        .slice()
        .sort((a, b) => (a.punchIn || "").localeCompare(b.punchIn || ""))[0];
      const lastOut = sessions
        .filter((s) => s.punchOut)
        .slice()
        .sort((a, b) => (a.punchOut || "").localeCompare(b.punchOut || ""))
        .pop();

      const legacy = {
        punchIn: firstIn?.punchIn || "",
        punchOut: lastOut?.punchOut || "",
        punchInPhoto: firstIn?.punchInPhoto || "",
        punchOutPhoto: lastOut?.punchOutPhoto || "",
      };

      const finalRec = { ...updated, ...legacy, location };

      if (idx !== -1) next[idx] = finalRec;
      else next.push(finalRec);

      persist(next);
      return true;
    },
    [attendance, getCurrentTimeHHMM, location, persist, today, userId, userName]
  );

  const punchOut = useCallback(
    (photo) => {
      const time = getCurrentTimeHHMM();

      const next = attendance.map(normalizeAttendanceRecord);
      const idx = next.findIndex((i) => i.date === today && i.employeeName === userName);
      if (idx === -1) {
        return { ok: false, reason: "Pehle punch in karo" };
      }

      const updated = upsertSessionForSameDay({
        record: next[idx],
        newSession: { type: "Punch Out", time, photo, createdAt: Date.now() },
      });

      const sessions = updated.sessions || [];
      const lastOut = sessions
        .filter((s) => s.punchOut)
        .slice()
        .sort((a, b) => (a.punchOut || "").localeCompare(b.punchOut || ""))
        .pop();
      const firstIn = sessions
        .filter((s) => s.punchIn)
        .slice()
        .sort((a, b) => (a.punchIn || "").localeCompare(b.punchIn || ""))[0];

      const legacy = {
        punchIn: firstIn?.punchIn || "",
        punchOut: lastOut?.punchOut || "",
        punchInPhoto: firstIn?.punchInPhoto || "",
        punchOutPhoto: lastOut?.punchOutPhoto || "",
      };

      next[idx] = { ...updated, ...legacy, location };
      persist(next);
      return { ok: true };
    },
    [attendance, getCurrentTimeHHMM, location, persist, today, userName]
  );

  return {
    user,
    userId,
    userName,
    userRole,
    canSeeAll,
    filterEmployee,
    setFilterEmployee,

    loading,
    uiError,
    location,
    locationError,
    today,

    attendance,
    filteredAttendance,

    todayRecord: todayRecord ? normalizeAttendanceRecord(todayRecord) : null,
    todaySummary,

    punchIn,
    punchOut,
    markHalfDay,
    markHoliday,
    markWeekOff,
    clearData,

    setUiError,
  };
}

