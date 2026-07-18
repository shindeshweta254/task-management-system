import { Routes, Route } from "react-router-dom";

import Splash from "./Pages/Splash/Splash";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import DirectorDashboard from "./Pages/DirectorDashboard/DirectorDashboard";
import Language from "./Pages/Language/Language";

import Task from "./Pages/Task/task";
import Checklist from "./Pages/Checklist/Checklist";
import Attendance from "./Pages/Attendance/attendance";
import Calendar from "./Pages/Calender/Calendar";
import Projects from "./Pages/Project/Project";
import Team from "./Pages/Team/Team";
import TeamDetails from "./Pages/Team/TeamDetails";

import Reports from "./Pages/Reports/Reports";
import Profile from "./Pages/Profile/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/select-language" element={<Language />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/director-dashboard"
        element={<DirectorDashboard />}
      />

      <Route path="/task" element={<Task />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/team" element={<Team />} />
      <Route path="/team/:teamId" element={<TeamDetails />} />

      <Route path="/reports" element={<Reports />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;