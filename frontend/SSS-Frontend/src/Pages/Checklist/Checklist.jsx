import Layout from "../../Components/Layout/Layout";

function Checklist() {
  const data = [
    ["Reception Cleaning", "Morning", "Pending"],
    ["Lobby Cleaning", "Morning", "Pending"],
    ["Lift Cleaning", "Morning", "Pending"],
    ["Washroom Cleaning", "Morning", "Pending"],
    ["Staircase Cleaning", "Afternoon", "Pending"],
    ["Parking Area Cleaning", "Afternoon", "Pending"],
    ["Security Check", "Evening", "Pending"],
    ["Garbage Collection", "Evening", "Pending"],
    ["Garden Area Cleaning", "Evening", "Pending"],
  ];

  return (
    <Layout title="Checklist">
      <div className="page-card">
        <h2>Daily Checklist</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>Work</th>
              <th>Shift</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td>
                  <select className="status-select">
                    <option>Pending</option>
                    <option>Done</option>
                    <option>Not Done</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Checklist;