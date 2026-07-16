import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        setMessage("Invalid Employee ID, Email or Password ❌");
        return;
      }

      const user = await response.json();

      const roleName = user.role?.roleName;

      if (role && roleName && role.toUpperCase() !== roleName.toUpperCase()) {
        setMessage("Selected role does not match ❌");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login Successful ✅");

      setTimeout(() => {
        const savedLang = localStorage.getItem("app_language");

        // Requirement: Login -> Select Language -> Dashboard
        if (!savedLang) {
          navigate("/select-language");
          return;
        }

        if (roleName === "EMPLOYEE") navigate("/dashboard");
        else if (roleName === "MANAGER") navigate("/manager-dashboard");
        else if (roleName === "DIRECTOR") navigate("/director-dashboard");
        else if (roleName === "SUPERVISOR") navigate("/supervisor-dashboard");
        else navigate("/dashboard");
      }, 700);
    } catch (error) {
      console.log(error);
      setMessage("Backend server not connected ❌");
    }
  };

  return (
    <div className="login-page">
        <div className="login-card">
        <div className="logo-wrapper">
          <img src="/logo.png" alt="SSS Logo" className="logo" />
        </div>

        <h1>{t("auth.loginTitle")}</h1>

        <p className="subtitle">{t("auth.subtitle")}</p>

        <p className="version">{t("auth.version")}</p>


        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>{t("auth.employeeId")}</label>
            <input
              type="text"
              placeholder="Enter Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label>Select Role</label>

            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="DIRECTOR">Director</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </div>
          

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-btn">
            {t("auth.login")}
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <div className="remember-me">
          <input type="checkbox" id="remember" />
          <label htmlFor="remember">{t("auth.rememberMe")}</label>
        </div>

        <a
          href="#"
          className="forgot-link"
          onClick={(e) => {
            e.preventDefault();
            alert("Please contact Administrator\n\nEmail: anantavathore@sssfmsindia.com");
          }}
        >
          Forgot Password?
        </a>
        
      <p className="signup-link">
  New Employee?{" "}
  <span onClick={() => navigate("/signup")}>
    Create Account
  </span>
</p>
      </div>

    </div>
  );
}

export default Login;