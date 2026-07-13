import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Team.css";

function Team() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Team load error:", e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <Layout title="Team">
      <div className="team-page">
        <div className="page-card">
          <h2>Team Members</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id || u.employeeId || u.email}>
                    <td>{u.name || "-"}</td>
                    <td>{u.role?.roleName || "EMPLOYEE"}</td>
                    <td>{u.phone || u.mobile || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}


export default Team;
