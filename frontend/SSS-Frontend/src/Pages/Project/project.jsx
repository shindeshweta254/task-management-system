import Layout from "../../Components/Layout/Layout";

function Projects() {
  return (
    <Layout title="Projects">
      <div className="page-card">
        <h2>Projects</h2>
        <table className="data-table">
          <thead>
            <tr><th>Project</th><th>Client</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Cleaning Management</td><td>Purva</td><td><span className="badge green-badge">Active</span></td></tr>
            <tr><td>Security Management</td><td>SSS</td><td><span className="badge blue-badge">Running</span></td></tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Projects;