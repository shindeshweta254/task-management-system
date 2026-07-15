import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: role,
          email: email,
          password: password,
        }),
      });

      if (response.ok) {
        const user = await response.json();

        localStorage.setItem("user", JSON.stringify(user));

        setMessage("Login Successful ✅");

        setTimeout(() => {
          if (user.role === "employee") {
            navigate("/dashboard");
          } else if (user.role === "manager") {
            navigate("/manager-dashboard");
          } else if (user.role === "director") {
            navigate("/director-dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      } else {
        setMessage("Invalid email or password ❌");
      }
    } catch (error) {
      setMessage("Backend server not connected ❌");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-wrapper">
          <img src="/logo.png" alt="SSS Logo" className="logo" />
        </div>

        <h1>SSS FACILITY SERVICES</h1>

        <p className="subtitle">Employee Task Management System</p>

        <p className="version">Version 1.0</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Select Role</label>

            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="director">Director</option>
               <option value="director">Site Supervisor</option>
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
            Login
          </button>

          {message && <p className="message">{message}</p>}
        </form>

        <div className="remember-me">
          <input type="checkbox" id="remember" />
          <label htmlFor="remember">Remember Me</label>
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
      </div>
    </div>
  );
}

export default Login;