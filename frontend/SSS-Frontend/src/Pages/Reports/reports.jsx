import Layout from "../../Components/Layout/Layout";

function Reports() {
  return (
    <Layout title="Reports">
      <div className="page-card">
        <h2>Monthly Reports</h2>
        <table className="data-table">
          <thead>
            <tr><th>Report</th><th>Month</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Task Report</td><td>July</td><td><span className="badge green-badge">Ready</span></td></tr>
            <tr><td>Attendance Report</td><td>July</td><td><span className="badge orange-badge">Pending</span></td></tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Reports;