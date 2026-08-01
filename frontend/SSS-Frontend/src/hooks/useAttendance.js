import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeSessionsSummary, normalizeAttendanceRecord, upsertSessionForSameDay } from "../utils/attendanceUtils";
import {
  checkIn as apiCheckIn,
  checkOut as apiCheckOut,
  fetchAllAttendance,
  fetchMyAttendance,
  fetchMySiteAttendance,
} from "../api/attendanceApi";

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

/**
 * Convert a backend Attendance object to the localStorage format used by the UI.
 */
function backendToLocalRecord(att) {
  if (!att) return null;
  const dateObj = att.attendanceDate ? new Date(att.attendanceDate + "T00:00:00") : new Date();
  const dateStr = dateObj.toLocaleDateString("en-IN");
  const checkInStr = att.checkInTime ? att.checkInTime.substring(0, 5) : "";
  const checkOutStr = att.checkOutTime ? att.checkOutTime.substring(0, 5) : "";
  return {
    id: att.id,
    employeeName: att.user?.name || "Unknown",
    userId: att.user?.id || null,
    date: dateStr,
    location: att.location || "",
    punchIn: checkInStr,
    punchOut: checkOutStr,
    status: att.status || "",
    workingHours: att.workingHours || 0,
    sessions: checkInStr
      ? [
          {
            punchIn: checkInStr,
            punchOut: checkOutStr,
            punchInPhoto: "",
            punchOutPhoto: "",
          },
        ]
      : [],
  };
}

export function useAttendance() {
  const user = useMemo(() => getUserFromStorage(), []);
  const userId = user?.id;
  const userName = user?.name || "Employee";
  const userRole = user?.role?.roleName || "EMPLOYEE";
  const userRoleUpper = useMemo(() => String(userRole || "").toUpperCase(), [userRole]);

  const canSeeAll = isPrivilegedRole(userRole) || isAuthorizedManager(userRole);
  const [filterEmployee, setFilterEmployee] = useState("");

  const [location, setLocation] = useState("Fetching location...");
  const [locationError, setLocationError] = useState("");

  const [attendance, setAttendance] = useState([]);
  const [backendAttendance, setBackendAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uiError, setUiError] = useState("");

  // Track the backend attendance ID for the current session (for checkout)
  const backendAttendanceIdRef = useRef(null);

  const today = useMemo(() => new Date().toLocaleDateString("en-IN"), []);

  // Load localStorage attendance
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

  // Fetch backend attendance based on user role
  useEffect(() => {
    const loadBackendAttendance = async () => {
      try {
        let data = [];
        if (canSeeAll || userRoleUpper === "DIRECTOR") {
          // Director/Owner/Admin sees all attendance
          data = await fetchAllAttendance();
        } else if (userRoleUpper === "SUPERVISOR" || userRoleUpper === "MANAGER") {
          // Supervisor/Manager sees their site's attendance
          data = await fetchMySiteAttendance();
        } else {
          // Employee sees only their own attendance
          data = await fetchMyAttendance();
        }
        setBackendAttendance(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load backend attendance:", e);
        // Keep existing data on error
      }
    };
    loadBackendAttendance();
  }, [canSeeAll, userRoleUpper]);

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

  // Merge backend attendance with localStorage attendance for display
  const mergedAttendance = useMemo(() => {
    const localRecords = attendance.map(normalizeAttendanceRecord);
    const backendRecords = backendAttendance.map(backendToLocalRecord).filter(Boolean);

    // Combine: prefer backend records by unique (employeeName + date) key
    const map = new Map();

    // Add backend records first
    for (const rec of backendRecords) {
      const key = `${rec.employeeName}|${rec.date}`;
      map.set(key, rec);
    }

    // Override/add localStorage records (localStorage might have data not yet synced to backend)
    for (const rec of localRecords) {
      const key = `${rec.employeeName || rec.userId}|${rec.date}`;
      if (!map.has(key)) {
        map.set(key, rec);
      }
    }

    return Array.from(map.values());
  }, [attendance, backendAttendance]);

  const filteredAttendance = useMemo(() => {
    const normalized = mergedAttendance.map(normalizeAttendanceRecord);

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
  }, [mergedAttendance, canSeeAll, filterEmployee, userId, userName]);

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
    async (photo) => {
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

      // Save to localStorage first (existing functionality)
      persist(next);

      // Also save to MySQL via backend API
      try {
        const result = await apiCheckIn(location);
        if (result && result.id) {
          backendAttendanceIdRef.current = result.id;
          // Reload backend attendance to sync
          let data = [];
          if (canSeeAll || userRoleUpper === "DIRECTOR") {
            data = await fetchAllAttendance();
          } else if (userRoleUpper === "SUPERVISOR" || userRoleUpper === "MANAGER") {
            data = await fetchMySiteAttendance();
          } else {
            data = await fetchMyAttendance();
          }
          setBackendAttendance(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Backend check-in failed, data saved to localStorage only:", e);
        // Don't block UI - localStorage data is already saved
      }

      return true;
    },
    [attendance, canSeeAll, getCurrentTimeHHMM, location, persist, today, userId, userName, userRoleUpper]
  );

  const punchOut = useCallback(
    async (photo) => {
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

      // Save to localStorage first (existing functionality)
      persist(next);

      // Also update MySQL via backend API
      try {
        // Try to find the attendance record for today from backend and call checkout
        const attendanceId = backendAttendanceIdRef.current;
        if (attendanceId) {
          await apiCheckOut(attendanceId);
        } else {
          // Fallback: Find the attendance ID from backend attendance matching today
          const todayISO = new Date().toISOString().split("T")[0];
          const found = backendAttendance.find(
            (a) => a.attendanceDate === todayISO && a.user?.id === userId
          );
          if (found && found.id) {
            await apiCheckOut(found.id);
          }
        }
        // Reload backend attendance
        let data = [];
        if (canSeeAll || userRoleUpper === "DIRECTOR") {
          data = await fetchAllAttendance();
        } else if (userRoleUpper === "SUPERVISOR" || userRoleUpper === "MANAGER") {
          data = await fetchMySiteAttendance();
        } else {
          data = await fetchMyAttendance();
        }
        setBackendAttendance(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Backend check-out failed, data saved to localStorage only:", e);
      }

      return { ok: true };
    },
    [attendance, backendAttendance, canSeeAll, getCurrentTimeHHMM, location, persist, today, userId, userName, userRoleUpper]
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

