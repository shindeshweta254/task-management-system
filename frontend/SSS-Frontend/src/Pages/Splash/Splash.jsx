import "./Splash.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2000);;

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

      <h1>SSS FMS INDIA PVT LTD</h1>
      <p>Employee Task Management System</p>
    </div>
  );
}

export default Splash;