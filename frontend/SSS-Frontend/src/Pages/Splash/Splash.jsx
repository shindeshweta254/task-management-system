import "./Splash.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const savedLanguage = localStorage.getItem("app_language");

      // Login nahi hua hai
      if (!token || !savedUser) {
        navigate("/login", { replace: true });
        return;
      }

      let user;

      try {
        user = JSON.parse(savedUser);
      } catch (error) {
        console.error("Saved user invalid:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("tokenType");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");

        navigate("/login", { replace: true });
        return;
      }

      // Language abhi select nahi ki
      if (!savedLanguage) {
        navigate("/select-language", { replace: true });
        return;
      }

      const roleName = String(
        user?.roleName ||
        user?.role?.roleName ||
        ""
      ).toUpperCase();

      // Saved login ke according direct dashboard
      if (roleName === "DIRECTOR") {
        navigate("/director-dashboard", { replace: true });
      } else if (roleName === "SUPERVISOR") {
        navigate("/supervisor-dashboard", { replace: true });
      } else if (roleName === "MANAGER") {
        navigate("/manager-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="logo-circle">
        <img
          src="/logo.png"
          alt="logo"
          className="logo"
        />
      </div>

      <h1>SSS FMS (I) PVT. LTD. Services</h1>
      <p>Employee Task Management System</p>
    </div>
  );
}

export default Splash;