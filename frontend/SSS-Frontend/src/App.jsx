import { Routes, Route } from "react-router-dom";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Checklist from "./Pages/Checklist/Checklist";
import Attendance from "./Pages/Attendance/attendance";
import Calendar from "./Pages/Calender/Calendar";
import Projects from "./Pages/Project/Project";
import Team from "./Pages/Team/team";
import Reports from "./Pages/Reports/Reports";
import Profile from "./Pages/Profile/Profile";
import Task from "./Pages/Task/task";
import Login from "./Pages/Login/Login";
import Splash from "./Pages/Splash/Splash";
import Signup from "./Pages/Signup/Signup";
import AddTask from "./Pages/AddTask/AddTask";
import SupervisorDashboard from "./Pages/SupervisorDashboard/SupervisorDashboard";
import DirectorDashboard from "./Pages/DirectorDashboard/DirectorDashboard";
import Language from "./Pages/Language/Language";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/language" element={<Language />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/team" element={<Team />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/task" element={<Task />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/add-task" element={<AddTask />} />
      <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
      <Route path="/director-dashboard" element={<DirectorDashboard />} />
    </Routes>
  );
}

export default App;