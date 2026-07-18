import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import "./TeamDetails.css";

import { fetchAllProjects } from "../../api/projectsApi";
import { fetchAllUsers } from "../../api/userApi";

const OFFICE_KEYWORDS = [
  "office",
  "head office",
  "admin",
  "hr",
  "accounts",
  "management",
  "director",
  "reception",
  "back office",
];

const normalize = (v) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const getId = (e) => e?.id ?? e?.employeeId ?? e?.userId ?? null;

const getProjectIdFromEmployee = (e) => {
  return (
    e?.projectId ??
    e?.project?.id ??
    e?.project?.projectId ??
    e?.siteId ??
    e?.site?.id ??
    e?.assignedProjectId ??
    e?.assignedSite ??
    null
  );
};

const getProjectLabelFromEmployee = (e) => {
  return (
    e?.projectName ??
    e?.project?.name ??
    e?.projectName ??
    e?.project?.projectName ??
    e?.siteName ??
    e?.site?.name ??
    e?.assignedSite ??
    null
  );
};

const getProjectLabelFromProject = (p) => {
  return p?.siteName ?? p?.name ?? p?.projectName ?? p?.project?.siteName ?? p?.project?.name ?? null;
};

const getSupervisorLabel = (team) => {
  const s =
    team?.supervisorName ??
    team?.supervisor?.name ??
    team?.managerName ??
    team?.manager?.name ??
    team?.assignedSupervisor?.name ??
    team?.assignedSupervisor ??
    null;
  return s ? String(s) : "Not assigned";
};

const getEmployeeProjectId = (user) =>
  String(
    user?.projectId ??
      user?.assignedProjectId ??
      user?.siteId ??
      user?.project?.id ??
      user?.site?.id ??
      ""
  );

const getEmployeeProjectName = (user) =>
  normalize(
    user?.projectName ??
      user?.siteName ??
      user?.projectSite ??
      user?.assignedSite ??
      user?.project?.siteName ??
      user?.project?.projectName ??
      user?.project?.name ??
      user?.site?.name ??
      ""
  );

const getProjectId = (project) =>
  String(project?.id ?? project?.projectId ?? project?.siteId ?? "");

const getProjectName = (project) =>
  normalize(project?.siteName ?? project?.projectName ?? project?.name ?? project?.sheetName ?? "");

const getEmployeesForProject = (project, users) => {
  const projectId = getProjectId(project);
  const projectName = getProjectName(project);

  return (users || []).filter((user) => {
    const employeeProjectId = getEmployeeProjectId(user);
    const employeeProjectName = getEmployeeProjectName(user);

    const idMatch =
      projectId &&
      employeeProjectId &&
      String(projectId) === String(employeeProjectId);

    const nameMatch =
      projectName &&
      employeeProjectName &&
      String(projectName) === String(employeeProjectName);

    return Boolean(idMatch || nameMatch);
  });
};

const getEmployeesForTeam = (team, employees, officeMembers, assignedEmployeeKeys) => {
  if (!team) return [];

  const employeeKeyOf = (u) => String(u?.id ?? u?.employeeId ?? u?.userId ?? "");

  // Head office filtering: only employees that are NOT assigned to any project
  // and either have no assignment fields OR belong to an office department/designation.
  if (team.teamId === "head-office") {
    return (employees || []).filter((user) => {
      const employeeKey = employeeKeyOf(user);

      // Must not already belong to any project group
      if (assignedEmployeeKeys.has(employeeKey)) return false;

      const employeeProjectId = getEmployeeProjectId(user);
      const employeeProjectName = getEmployeeProjectName(user);

      // Treat as Head Office only when ALL assignment fields are effectively empty
      const hasNoAssignment = !employeeProjectId && !employeeProjectName;

      const department = normalize(user?.department);
      const designation = normalize(user?.designation);
      const role = normalize(user?.role?.roleName ?? user?.roleName);

      const isOfficeDepartment = [
        "head office",
        "office",
        "admin",
        "administration",
        "hr",
        "human resources",
        "accounts",
        "management",
        "director",
        "reception",
        "back office",
      ].some(
        (term) =>
          department.includes(term) ||
          designation.includes(term) ||
          role.includes(term)
      );

      return Boolean(hasNoAssignment || isOfficeDepartment);
    });
  }

  // Project/site team filtering (strict per-project matching)
  return getEmployeesForProject(team, employees || []);
};

function TeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, u] = await Promise.all([fetchAllProjects(), fetchAllUsers()]);
      setProjects(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) {
      setError(e?.message || "Failed to load team details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const selectedTeam = useMemo(() => {
    if (!teamId) return null;

    if (String(teamId) === "head-office") {
      return { teamId: "head-office", siteName: "Head Office" };
    }

    const selectedId = String(teamId);

    // Find matching team context from available groups/projects
    const match = (projects || []).find(
      (p) => {
        const candidates = [p?.id, p?.projectId, p?._id, p?.siteId];
        return candidates.some((c) => String(c ?? "") === selectedId);
      }
    );

    if (match) {
      const pid = match?.id ?? match?.projectId ?? match?._id;
      return {
        teamId: selectedId,
        id: match?.id ?? pid,
        projectId: pid,
        siteName: match?.siteName ?? match?.name,
        sheetName: match?.sheetName,
      };
    }

    // Fallback: match by siteName label
    const byLabel = (projects || []).find(
      (p) => normalize(p?.siteName) === normalize(teamId)
    );

    if (byLabel) {
      const pid = byLabel?.id ?? byLabel?.projectId ?? byLabel?._id;
      return {
        teamId: selectedId,
        id: byLabel?.id ?? pid,
        projectId: pid,
        siteName: byLabel?.siteName,
        sheetName: byLabel?.sheetName,
      };
    }

    return null;
  }, [teamId, projects]);

  const employeesForTeam = useMemo(() => {
    if (!selectedTeam) return [];
    return getEmployeesForTeam(selectedTeam, users);
  }, [selectedTeam, users]);

  const visibleError = error ? normalize(error) : "";

  return (
    <Layout title="Team Details">
      <div className="team-details-page">
        <div className="team-details-card">
          <div className="team-details-header">
            <button type="button" className="team-details-back" onClick={() => navigate("/team")}>← Back to Teams</button>
            {selectedTeam ? (
              <div className="team-details-title">
                <h2>{selectedTeam?.siteName || "Team"}</h2>
                <div className="team-details-sub">
                  Supervisor: {selectedTeam?.teamId === "head-office" ? "Not assigned" : getSupervisorLabel(selectedTeam)}
                </div>
                <div className="team-details-count">Total employees: {employeesForTeam.length}</div>
              </div>
            ) : (
              <div className="team-details-title">
                <h2>Team</h2>
                <div className="team-details-sub">Team not found.</div>
              </div>
            )}
          </div>

          {loading ? (
            <p className="team-details-loading">Loading...</p>
          ) : selectedTeam == null ? (
            <p className="team-details-empty">No team found for this id.</p>
          ) : employeesForTeam.length === 0 ? (
            <p className="team-details-empty">{teamId === "head-office" ? "No office staff found" : "No employees assigned to this team."}</p>
          ) : (
            <div className="team-details-table-wrap">
              <table className="team-details-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Contact No</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeesForTeam.map((u, idx) => (
                    <tr key={getId(u) || `${u.employeeId || idx}`}>
                      <td>{idx + 1}</td>
                      <td>{u.employeeId || u.id || "-"}</td>
                      <td>{u.name || "-"}</td>
                      <td>{u.contactNo || u.phoneNo || "-"}</td>
                      <td>{u.department || "-"}</td>
                      <td>{u.designation || "-"}</td>
                      <td>{u.role?.roleName || "EMPLOYEE"}</td>
                      <td>{u.status || "-"}</td>
                      <td>
                        <button type="button" className="team-details-action" onClick={() => navigate("/profile")}>View Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && !loading && (
            <p className="team-details-error">{error}</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamDetails;

