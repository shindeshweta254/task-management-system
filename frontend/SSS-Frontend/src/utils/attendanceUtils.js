// Attendance utilities for multi-session punch calculations and shaping.
// No backend knowledge here.

export function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function minutesFromHHMM(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function formatDurationMinutes(totalMinutes) {
  if (totalMinutes == null || !Number.isFinite(totalMinutes) || totalMinutes <= 0) return "0 min";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function computeSessionsSummary({ sessions = [], officeStart = "10:15", officeEnd = "18:00", fullDayHours = 8, halfDayHours = 4, dayType, dayMode }) {
  // dayType: Holiday/Week Off/Working Day
  // dayMode: FULL_DAY/HALF_DAY

  if (dayType === "Holiday") {
    return {
      totalWorkingMinutes: 0,
      breakMinutes: 0,
      firstPunchIn: null,
      finalPunchOut: null,
      status: "Holiday",
      lateBy: null,
      earlyOut: null,
      overtime: null,
    };
  }

  if (dayType === "Week Off") {
    return {
      totalWorkingMinutes: 0,
      breakMinutes: 0,
      firstPunchIn: null,
      finalPunchOut: null,
      status: "Week Off",
      lateBy: null,
      earlyOut: null,
      overtime: null,
    };
  }

  const totalCompleted = sessions
    .filter((s) => s.punchIn && s.punchOut)
    .map((s) => ({ punchIn: s.punchIn, punchOut: s.punchOut }));

  const totalWorkingMinutes = totalCompleted.reduce((acc, s) => {
    const inMin = minutesFromHHMM(s.punchIn);
    const outMin = minutesFromHHMM(s.punchOut);
    if (inMin == null || outMin == null) return acc;
    return acc + Math.max(0, outMin - inMin);
  }, 0);

  const sortedSessions = sessions
    .filter((s) => s.punchIn)
    .slice()
    .sort((a, b) => {
      const ai = minutesFromHHMM(a.punchIn) ?? 0;
      const bi = minutesFromHHMM(b.punchIn) ?? 0;
      return ai - bi;
    });

  // Break: gap between previous completed session punchOut and next session punchIn.
  let breakMinutes = 0;
  for (let i = 0; i < sortedSessions.length; i++) {
    const cur = sortedSessions[i];
    const next = sortedSessions[i + 1];
    if (!cur?.punchOut || !next?.punchIn) continue;

    const curOut = minutesFromHHMM(cur.punchOut);
    const nextIn = minutesFromHHMM(next.punchIn);
    if (curOut == null || nextIn == null) continue;

    const gap = nextIn - curOut;
    if (gap > 0) breakMinutes += gap;
  }

  const firstPunchIn = (() => {
    const first = sessions
      .filter((s) => s.punchIn)
      .slice()
      .sort((a, b) => (minutesFromHHMM(a.punchIn) ?? 0) - (minutesFromHHMM(b.punchIn) ?? 0))[0];
    return first?.punchIn ?? null;
  })();

  const finalPunchOut = (() => {
    const last = sessions
      .filter((s) => s.punchOut)
      .slice()
      .sort((a, b) => (minutesFromHHMM(a.punchOut) ?? 0) - (minutesFromHHMM(b.punchOut) ?? 0))
      .pop();
    return last?.punchOut ?? null;
  })();

  // Keep legacy day status logic mostly intact, but now using totalWorkingMinutes and first punch.
  // Late by & early out only based on first in and final out.
  const officeStartMin = minutesFromHHMM(officeStart) ?? 0;
  const officeEndMin = minutesFromHHMM(officeEnd) ?? 0;

  const firstInMin = minutesFromHHMM(firstPunchIn);
  const finalOutMin = minutesFromHHMM(finalPunchOut);

  const lateMin =
    firstInMin == null
      ? null
      : Math.max(0, firstInMin - officeStartMin);

  const earlyMin =
    finalOutMin == null
      ? null
      : Math.max(0, officeEndMin - finalOutMin);

  const overtimeTargetMin = fullDayHours * 60;
  const overtimeMin = Math.max(0, totalWorkingMinutes - overtimeTargetMin);

  if (dayMode === "HALF_DAY") {
    return {
      totalWorkingMinutes: halfDayHours * 60,
      breakMinutes,
      firstPunchIn,
      finalPunchOut,
      status: "Half Day",
      lateBy: null,
      earlyOut: null,
      overtime: null,
    };
  }

  if (!firstPunchIn) {
    return {
      totalWorkingMinutes: 0,
      breakMinutes: 0,
      firstPunchIn: null,
      finalPunchOut: null,
      status: "Absent",
      lateBy: null,
      earlyOut: null,
      overtime: null,
    };
  }

  let status = "Present";
  if (totalWorkingMinutes < 240) status = "Absent";
  else if (totalWorkingMinutes < 480) status = "Half Day";
  else if (lateMin && lateMin > 0) status = `Late ${formatDurationMinutes(lateMin)}`;

  return {
    totalWorkingMinutes,
    breakMinutes,
    firstPunchIn,
    finalPunchOut,
    status,
    lateBy: lateMin != null ? formatDurationMinutes(lateMin) : null,
    earlyOut: earlyMin != null ? formatDurationMinutes(earlyMin) : null,
    overtime: overtimeMin > 0 ? formatDurationMinutes(overtimeMin) : null,
  };
}

export function normalizeAttendanceRecord(record) {
  // Legacy record shape: punchIn/punchOut fields
  // New multi-session shape: sessions[]
  if (!record || typeof record !== "object") return {
    employeeName: "",
    date: "",
    location: "",
    dayType: "Working Day",
    dayMode: "FULL_DAY",
    sessions: [],
    // photos kept for compatibility
  };

  const sessions = Array.isArray(record.sessions)
    ? record.sessions
    : (record.punchIn || record.punchOut)
      ? [
          {
            punchIn: record.punchIn || "",
            punchOut: record.punchOut || "",
            punchInPhoto: record.punchInPhoto || "",
            punchOutPhoto: record.punchOutPhoto || "",
          },
        ]
      : [];

  return {
    ...record,
    sessions,
  };
}

export function upsertSessionForSameDay({ record, newSession, allowConcurrentPunchIn = false }) {
  // Only one active session without punchOut at a time.
  // If there is an active session already, keep it and do NOT overwrite.
  const next = normalizeAttendanceRecord(record);
  const sessions = Array.isArray(next.sessions) ? next.sessions.slice() : [];

  const hasActive = sessions.some((s) => !!s?.punchIn && !s?.punchOut);

  if (newSession.type === "Punch In") {
    if (hasActive && !allowConcurrentPunchIn) {
      // return unchanged: avoid overwriting earlier session
      return { ...next, sessions };
    }
    sessions.push({
      punchIn: newSession.time,
      punchOut: "",
      punchInPhoto: newSession.photo || "",
      punchOutPhoto: "",
      createdAt: newSession.createdAt || Date.now(),
    });
    return { ...next, sessions };
  }

  if (newSession.type === "Punch Out") {
    // Punch out should apply to the latest active session.
    const idx = (() => {
      for (let i = sessions.length - 1; i >= 0; i--) {
        const s = sessions[i];
        if (s?.punchIn && !s?.punchOut) return i;
      }
      return -1;
    })();

    if (idx === -1) {
      // nothing to punch out
      return { ...next, sessions };
    }

    sessions[idx] = {
      ...sessions[idx],
      punchOut: newSession.time,
      punchOutPhoto: newSession.photo || "",
      updatedAt: newSession.createdAt || Date.now(),
    };

    return { ...next, sessions };
  }

  return { ...next, sessions };
}

