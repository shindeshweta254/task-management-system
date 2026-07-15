export function getUserFromStorage(key = "user") {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

export function getUserName(user = {}) {
  return user?.name || "Director";
}

export function getUserInitials(userName = "") {
  const nameParts = String(userName).trim().split(" ").filter(Boolean);
  if (nameParts.length > 1) {
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  return nameParts[0]?.[0]?.toUpperCase() || "D";
}

