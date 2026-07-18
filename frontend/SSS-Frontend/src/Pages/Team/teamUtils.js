export function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function readableError(err) {
  const msg = err?.message;
  if (!msg) return "Something went wrong";
  return String(msg).replace(/\n+/g, " ").slice(0, 200);
}

export function getDisplayName(person) {
  if (!person) return "Not assigned";
  return person?.name || person?.fullName || person?.username || person?.email || person?.id || "Not assigned";
}

// Builds team groups for the Team page.
// This implementation is defensive and works with the shapes returned by:
// - projects: /api/projects (imported excel)
// - users: /api/users
export function buildTeamGroups(projects, users) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Helper to get possible project/site id attached to a user
  const getProjectIdFromUser = (u) =>
    u?.projectId ??
    u?.project?.id ??
    u?.project?.projectId ??
    u?.siteId ??
    u?.site?.id ??
    u?.assignedProjectId ??
    u?.assignedSite ??
    null;

  const getProjectNameFromUser = (u) =>
    u?.projectName ??
    u?.project?.name ??
    u?.project?.projectName ??
    u?.siteName ??
    u?.site?.name ??
    u?.assignedSite ??
    null;

  const getProjectLabelFromProject = (p) =>
    p?.siteName ?? p?.name ?? p?.projectName ?? null;

  const usersByProjectId = new Map();
  for (const u of safeUsers) {
    const pid = getProjectIdFromUser(u);
    if (pid == null) continue;
    const key = String(pid);
    if (!usersByProjectId.has(key)) usersByProjectId.set(key, []);
    usersByProjectId.get(key).push(u);
  }

  // If a user doesn't have projectId, try matching by label
  const labelToUsers = new Map();
  for (const u of safeUsers) {
    const lab = normalizeText(getProjectNameFromUser(u));
    if (!lab) continue;
    if (!labelToUsers.has(lab)) labelToUsers.set(lab, []);
    labelToUsers.get(lab).push(u);
  }

  const groups = [];

  // Office/head-office group
  // We'll include users that do NOT match any project id/label.
  const usedUserIds = new Set();
  for (const p of safeProjects) {
    const pid = p?.id ?? p?.projectId;
    if (pid == null) continue;
    const pidKey = String(pid);
    const members = usersByProjectId.get(pidKey) || [];
    for (const m of members) {
      const id = m?.id ?? m?.employeeId ?? m?._id;
      if (id != null) usedUserIds.add(String(id));
    }
  }

  for (const u of safeUsers) {
    const uid = u?.id ?? u?.employeeId ?? u?._id;
    const matchedById = getProjectIdFromUser(u) != null && usersByProjectId.has(String(getProjectIdFromUser(u)));
    const matchedByLabel = (() => {
      const lab = normalizeText(getProjectNameFromUser(u));
      if (!lab) return false;
      // if label exists in projects, consider matched
      return safeProjects.some((p) => normalizeText(getProjectLabelFromProject(p)) === lab);
    })();

    if (matchedById || matchedByLabel) continue;
    if (uid != null) usedUserIds.add(String(uid));
  }

  const memberCountOffice = safeUsers.filter((u) => {
    const uid = u?.id ?? u?.employeeId ?? u?._id;
    if (uid == null) return false;
    // office members are those not mapped to any project group; this is approximate.
    const pid = getProjectIdFromUser(u);
    if (pid != null && usersByProjectId.has(String(pid))) return false;
    const lab = normalizeText(getProjectNameFromUser(u));
    if (lab && safeProjects.some((p) => normalizeText(getProjectLabelFromProject(p)) === lab)) return false;
    return true;
  }).length;

  groups.push({
    type: "OFFICE",
    id: "head-office",
    routeId: "head-office",
    name: "Head Office",
    memberCount: memberCountOffice,
    supervisor: null,
  });

  // Site/project groups
  for (const p of safeProjects) {
    const pid = p?.id ?? p?.projectId;
    const label = getProjectLabelFromProject(p);
    const routeId = pid != null ? String(pid) : (label != null ? String(label) : "");

    if (!routeId) continue;

    const pidKey = pid != null ? String(pid) : null;
    let members = pidKey && usersByProjectId.get(pidKey);
    if (!members) {
      const labKey = normalizeText(label);
      members = labelToUsers.get(labKey) || [];
    }

    // de-dup by user id
    const seen = new Set();
    const uniqueMembers = (members || []).filter((u) => {
      const uid = u?.id ?? u?.employeeId ?? u?._id;
      if (uid == null) return true;
      const k = String(uid);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    groups.push({
      type: "SITE",
      id: String(routeId),
      routeId: String(routeId),
      name: label || String(routeId),
      memberCount: uniqueMembers.length,
      supervisor: p?.supervisor ?? p?.manager ?? null,
      project: p,
      projectId: pid,
      siteName: label,
      sheetName: p?.sheetName,
    });
  }

  return groups;
}

