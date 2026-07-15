import { useMemo, useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import "./Team.css";

import { fetchAllUsers } from "../../api/userApi";
import { fetchAllProjects } from "../../api/projectsApi";
import { getUserFromStorage } from "../../utils/userStorage";

function normalizeRole(roleName) {
  return String(roleName || "").toUpperCase().trim();
}

function getUserLabel(u) {
  return u?.name || u?.employeeId || "-";
}

function Team() {
  const viewer = getUserFromStorage("user");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  // grouped view
  const [activeGroupKey, setActiveGroupKey] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([fetchAllUsers(), fetchAllProjects()]);
      setUsers(Array.isArray(u) ? u : []);
      setProjects(Array.isArray(p) ? p : []);
    } catch (e) {
      setUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersById = useMemo(() => {
    const map = new Map();
    for (const u of users || []) {
      if (u?.id != null) map.set(u.id, u);
    }
    return map;
  }, [users]);

  // Build groups by project/site (primary). If projects are empty, fallback to department grouping using users only.
  const groups = useMemo(() => {
    const projectGroups = (projects || []).map((proj) => {
      const projEmployees = Array.isArray(proj?.employees) ? proj.employees : [];

      // Determine manager/supervisor by role (best-effort). If project employees already have roleName, use it.
      const managerLike = projEmployees.find((e) => {
        const rn = normalizeRole(e?.role?.roleName || e?.roleName || e?.designation);
        return rn.includes("MANAGER") || rn.includes("SUPERVISOR");
      });

      const memberIds = projEmployees
        .map((e) => e?.id ?? e?.employeeId ?? e?.userId)
        .filter((x) => x != null);

      // Build members list from users, avoiding duplicates.
      const members = [];
      const seen = new Set();
      for (const mid of memberIds) {
        const u = usersById.get(mid);
        if (u && !seen.has(u.id)) {
          seen.add(u.id);
          members.push(u);
        }
      }

      // If we couldn't match ids to users, keep empty members to avoid incorrect duplicates.
      return {
        key: `proj_${proj?.id ?? proj?.siteName ?? Math.random()}`,
        type: "PROJECT",
        siteName: proj?.siteName || "-",
        sheetName: proj?.sheetName || "-",
        manager: managerLike ? usersById.get(managerLike?.id ?? managerLike?.employeeId ?? managerLike?.userId) : null,
        members,
        memberCount: members.length,
        assignedLabel: proj?.siteName || "-",
      };
    });

    if (projectGroups.length > 0) return projectGroups;

    // fallback: department grouping
    const deptMap = new Map();
    for (const u of users || []) {
      const dept = u?.department || "-";
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept).push(u);
    }

    const result = [];
    for (const [dept, list] of deptMap.entries()) {
      const manager = list.find((u) => {
        const rn = normalizeRole(u?.role?.roleName);
        return rn.includes("MANAGER") || rn.includes("SUPERVISOR");
      });

      result.push({
        key: `dept_${dept}`,
        type: "DEPARTMENT",
        siteName: dept,
        sheetName: "-",
        manager: manager || null,
        members: list,
        memberCount: list.length,
        assignedLabel: dept,
      });
    }

    return result;
  }, [projects, users, usersById]);

  const activeGroup = useMemo(() => {
    if (!groups?.length) return null;
    const found = groups.find((g) => g.key === activeGroupKey);
    return found || groups[0] || null;
  }, [groups, activeGroupKey]);

  return (
    <Layout title="Team">
      <div className="team-page">
        <div className="page-card">
          <h2>Operational Teams</h2>

          {loading ? (
            <p>Loading...</p>
          ) : groups.length === 0 ? (
            <p>No teams available</p>
          ) : (
            <div className="team-group-layout">

              <div className="team-groups-list">
                <h3 className="team-subtitle">Teams</h3>
                <div className="team-groups">
                  {groups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      className={g.key === activeGroup?.key ? "team-group-btn active" : "team-group-btn"}
                      onClick={() => setActiveGroupKey(g.key)}
                    >
                      <div className="team-group-title">
                        {g.type === "PROJECT" ? `🏗️ ${g.siteName}` : `🏢 ${g.siteName}`}
                      </div>
                      <div className="team-group-meta">
                        <span>👥 {g.memberCount}</span>
                        <span>{g.manager ? `👤 ${getUserLabel(g.manager)}` : "👤 -"}</span>
                      </div>
                      <div className="team-group-assigned">Assigned: {g.assignedLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="team-members-panel">
                <div className="team-members-head">
                  <h3>
                    {activeGroup?.type === "PROJECT" ? "Project Team" : "Department Team"} - {activeGroup?.siteName}
                  </h3>
                  <div className="team-members-count">👥 {activeGroup?.memberCount || 0} members</div>
                </div>

                <div className="team-manager-row">
                  <div className="team-manager-label">Manager/Supervisor:</div>
                  <div className="team-manager-value">{activeGroup?.manager ? getUserLabel(activeGroup.manager) : "-"}</div>
                </div>

                <div className="team-members-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Contact No</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeGroup?.members || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="team-empty">No team members found</td>
                        </tr>
                      ) : (
                        activeGroup.members.map((u) => (
                          <tr key={u.id || u.employeeId}>
                            <td>{u.employeeId || "-"}</td>
                            <td>{u.name || "-"}</td>
                            <td>{u.contactNo || "-"}</td>
                            <td>{u.department || "-"}</td>
                            <td>{u.role?.roleName || "EMPLOYEE"}</td>
                            <td>{u.status || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Team;


