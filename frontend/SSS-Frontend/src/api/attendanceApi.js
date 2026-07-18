import { API_BASE_URL } from "./index";

// IMPORTANT:
// The existing codebase currently stores attendance in localStorage (attendanceData).
// Backend endpoints for multi-session attendance are not known from the repo scope.
// Therefore, this API layer only provides safe optional helpers that won't break UI.
// If backend supports older single-session shape, we keep compatibility via localStorage fallback.

const jsonOrText = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Placeholder functions (no inventing endpoints). The UI will rely on localStorage.
// These are still here so hooks/pages can call a single abstraction layer.

export async function fetchAttendanceForUser(/* userId */) {
  // No known supported endpoint in this project scope.
  // Return empty and let hook use localStorage.
  return [];
}

export async function saveAttendanceForUser(/* userId, payload */) {
  // No known supported endpoint in this project scope.
  return { saved: false, reason: "Backend multi-session endpoints not available in this codebase" };
}

export async function fetchAllEmployeesAttendanceForToday(/* today */) {
  return [];
}

export async function saveAttendanceForAdmin(/* payload */) {
  return { saved: false, reason: "Backend multi-session endpoints not available in this codebase" };
}

export async function fetchDayTypeAndMode(/* userId, date */) {
  return null;
}

