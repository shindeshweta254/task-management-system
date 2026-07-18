import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { fetchAllUsers } from "../../api/userApi";
import { fetchAllProjects } from "../../api/projectsApi";
import {
  buildTeamGroups,
  getDisplayName,
  normalizeText,
  readableError,
} from "./teamUtils";
import "./Team.css";

function Team() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      setLoading(true);
      setError("");

      try {
        const [usersResponse, projectsResponse] = await Promise.all([
          fetchAllUsers(),
          fetchAllProjects(),
        ]);

        if (!isMounted) return;

        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setProjects(Array.isArray(projectsResponse) ? projectsResponse : []);
      } catch (err) {
        if (!isMounted) return;

        setUsers([]);
        setProjects([]);
        setError(readableError(err));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    return buildTeamGroups(projects, users);
  }, [projects, users]);

  const filteredGroups = useMemo(() => {
    const query = normalizeText(search);

    if (!query) {
      return groups;
    }

    return groups.filter((group) => {
      const supervisorName = getDisplayName(group.supervisor);

      return (
        normalizeText(group.name).includes(query) ||
        normalizeText(supervisorName).includes(query)
      );
    });
  }, [groups, search]);

  const openTeamDetails = (group) => {
    navigate(`/team/${group.routeId}`, {
      state: {
        teamName: group.name,
      },
    });
  };

  return (
    <Layout title="Team">
      <div className="team-page">
        <section className="page-card">
          <div className="team-page-header">
            <div>
              <h2>Operational Teams</h2>
              <p>Office and site-wise employee teams</p>
            </div>

            <input
              type="search"
              className="team-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team or supervisor..."
            />
          </div>

          {loading && (
            <div className="team-state">
              Loading teams...
            </div>
          )}

          {!loading && error && (
            <div className="team-state team-error">
              {error}
            </div>
          )}

          {!loading && !error && filteredGroups.length === 0 && (
            <div className="team-state">
              No teams found.
            </div>
          )}

          {!loading && !error && filteredGroups.length > 0 && (
            <div className="team-card-grid">
              {filteredGroups.map((group) => (
                <button
                  key={`${group.type}-${group.id}`}
                  type="button"
                  className="team-card"
                  onClick={() => openTeamDetails(group)}
                >
                  <div className="team-card-top">
                    <span className="team-card-icon">
                      {group.type === "OFFICE" ? "🏢" : "🏗️"}
                    </span>

                    <span className="team-view-label">
                      View Team →
                    </span>
                  </div>

                  <h3>{group.name}</h3>

                  <div className="team-count-row">
                    <strong>{group.memberCount}</strong>

                    <span>
                      {group.memberCount === 1
                        ? "Employee"
                        : "Employees"}
                    </span>
                  </div>

                  <div className="team-supervisor">
                    <span>Supervisor / Manager</span>

                    <strong>
                      {getDisplayName(group.supervisor)}
                    </strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Team;