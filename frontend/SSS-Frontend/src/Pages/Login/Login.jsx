import "./Login.css";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {

const [showPassword, setShowPassword] = useState(false);
const [message, setMessage] = useState("");

const handleLogin = (e) => {
e.preventDefault();


setMessage("Login Successful");


};

return ( <div className="login-page">


  <div className="login-card">

    <div className="logo-wrapper">
      <img
        src="/logo.png"
        alt="SSS Logo"
        className="logo"
      />
    </div>

    <h1>SSS FACILITY SERVICES</h1>

    <p className="subtitle">
      Employee Task Management System
    </p>

    <p className="version">
      Version 1.0
    </p>

    <form onSubmit={handleLogin}>

      <div className="input-group">
        <label>Select Role</label>

        <select className="role-select">
          <option value="">Select Role</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <div className="input-group">

        <label>Email</label>

        <input
          type="email"
          placeholder="Enter Email"
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

      <button
        type="submit"
        className="login-btn"
      >
        Login
      </button>

      {message && (
        <p className="message">
          {message}
        </p>
      )}

    </form>

    <div className="remember-me">

      <input
        type="checkbox"
        id="remember"
      />

      <label htmlFor="remember">
        Remember Me
      </label>

    </div>

    <a
      href="#"
      className="forgot-link"
      onClick={(e) => {
        e.preventDefault();
        alert(
          "Please contact Administrator\n\nEmail: admin@sssfms.com"
        );
      }}
    >
      Forgot Password?
    </a>

  </div>

</div>


);
}

export default Login;
