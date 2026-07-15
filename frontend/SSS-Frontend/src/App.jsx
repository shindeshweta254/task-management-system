import { BrowserRouter, Routes, Route } from "react-router-dom";

import Splash from "./Pages/Splash/Splash";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import DirectorDashboard from "./Pages/DirectorDashboard/DirectorDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/director-dashboard" element={<DirectorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;