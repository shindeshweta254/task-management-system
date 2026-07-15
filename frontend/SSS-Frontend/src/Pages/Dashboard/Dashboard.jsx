import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>SSS FMS</h2>
        </div>

        <ul className="menu">
          <li className="active">Dashboard</li>
          <li>My Tasks</li>
          <li>Checklist</li>
          <li>Attendance</li>
          <li>Calendar</li>
          <li>Projects</li>
          <li>Team</li>
          <li>Reports</li>
          <li>Profile</li>
          <li>Settings</li>
          <li className="logout">Logout</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Navbar */}
        <div className="navbar">
          <h2>Dashboard</h2>

          <input
            type="text"
            placeholder="Search..."
            className="search-box"
          />
        </div>

        {/* Welcome */}
        <div className="welcome-box">
          <h1>Welcome Back 👋</h1>
          <p>Here's what's happening today.</p>
        </div>

        {/* Cards */}
        <div className="cards">

          <div className="card">
            <h2>08</h2>
            <p>Today's Tasks</p>
          </div>

          <div className="card">
            <h2>05</h2>
            <p>Pending Tasks</p>
          </div>

          <div className="card">
            <h2>03</h2>
            <p>Completed Tasks</p>
          </div>

          <div className="card">
            <h2>02</h2>
            <p>Deadlines</p>
          </div>

          <div className="card">
            <h2>85%</h2>
            <p>Monthly Score</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;