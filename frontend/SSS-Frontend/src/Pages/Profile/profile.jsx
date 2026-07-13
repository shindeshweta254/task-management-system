import { useMemo } from "react";
import Layout from "../../components/Layout/Layout";
import "./Profile.css";

function Profile() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  }, []);

  const roleName = user.role?.roleName || "EMPLOYEE";
  const name = user.name || "Employee";
  const email = user.email || "-";
  const company = user.company || user.organization || "SSS Facility Services";

  const nameParts = name.trim().split(" ");
  const initials =
    nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "E";

  return (
    <Layout title="Profile">
      <div className="profile-page-wrap">
        <div className="profile-card">
          <div className="profile-header">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="profile-avatar">{initials}</div>
              <div className="profile-meta">
                <h2>{name}</h2>
                <div className="profile-row">
                  <b>Role</b>
                  <span>{roleName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-row" style={{ marginTop: 10 }}>
            <b>Name</b>
            <span>{name}</span>
          </div>
          <div className="profile-row">
            <b>Email</b>
            <span>{email}</span>
          </div>
          <div className="profile-row">
            <b>Company</b>
            <span>{company}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;

