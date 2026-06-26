import { BrowserRouter, Routes, Route } from "react-router-dom";
import Attendance from "./Pages/Attendance/Attendance";
import Splash from "./Pages/Splash/Splash";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import AddTask from "./Pages/AddTask/AddTask";
import Tasklist from "./Pages/Tasklist/Tasklist";
import Checklist from "./Pages/Checklist/Checklist";
import CalendarPage from "./Pages/Calender/calender";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-task" element={<AddTask />} />
          <Route path="/my-tasks" element={<Tasklist />} />
          <Route path="/attendance" element={<Attendance />} /> 
          <Route path="/checklist" element={<Checklist />} />
<Route path="/calendar" element={<CalendarPage />} />        </Routes>
    </BrowserRouter>
  );
}

export default App;