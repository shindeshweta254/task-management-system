import Layout from "../../Components/Layout/Layout";

function Tasks() {
  const data = [
    ["1", "Update Checklist", "Completed", "High", "01 Jul 2026"],
    ["2", "Prepare Monthly Report", "Pending", "Medium", "05 Jul 2026"],
    ["3", "Employee Attendance", "In Progress", "Low", "08 Jul 2026"],
  ];

  return (
    <Layout title="Tasks">
      <div className="page-card">
        <h2>Task List</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Task</th><th>Status</th><th>Priority</th><th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row[0]}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td><span className="badge blue-badge">{row[2]}</span></td>
                <td>{row[3]}</td>
                <td>{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Tasks;