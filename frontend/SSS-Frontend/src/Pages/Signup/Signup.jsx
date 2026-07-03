
import "./Signup.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          name,
          email: "operation@sssfmsindia.com",
          password,
          department,
          status: "ACTIVE",
          role: {
            roleName: "EMPLOYEE",
          },
        }),
      });

      if (!response.ok) {
        setMessage("Registration Failed ❌");
        return;
      }

      setMessage("Employee Registered Successfully ✅");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.log(error);
      setMessage("Backend Not Connected ❌");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        <img src="/logo.png" className="signup-logo" alt="logo" />

        <h2>SSS FMS INDIA PVT LTD</h2>

        <p>Create Employee Account</p>

        <form onSubmit={handleSignup}>

          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Register
          </button>

        </form>

        {message && <p className="message">{message}</p>}

        <p className="login-link">
          Already Registered?

          <span onClick={() => navigate("/login")}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
}

export default Signup;