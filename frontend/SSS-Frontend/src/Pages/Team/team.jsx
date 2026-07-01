import Layout from "../../Components/Layout/Layout";

function Team() {
  return (
    <Layout title="Team">
      <div className="page-card">
        <h2>Team Members</h2>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Phone</th></tr>
          </thead>
          <tbody>
            <tr><td>Harsh Sharma</td><td>Admin</td><td>9876543210</td></tr>
            <tr><td>Rahul Patil</td><td>Supervisor</td><td>9876543211</td></tr>
            <tr><td>Amit Jadhav</td><td>Staff</td><td>9876543212</td></tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Team;