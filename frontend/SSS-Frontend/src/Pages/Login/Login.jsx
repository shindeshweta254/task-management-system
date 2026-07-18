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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: employeeId.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      if (!response.ok) {
        let backendMessage = `Login failed (${response.status})`;

        const responseText = await response.text();

        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);

            backendMessage =
              errorData?.message ||
              errorData?.error ||
              backendMessage;
          } catch {
            if (responseText.length < 300) {
              backendMessage = responseText;
            }
          }
        }

        setMessage(backendMessage);
        return;
      }

      const user = await response.json();
      const roleName = String(
        user?.role?.roleName || ""
      ).toUpperCase();

      if (
        role &&
        roleName &&
        role.toUpperCase() !== roleName
      ) {
        setMessage("Selected role does not match ❌");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login Successful ✅");

      setTimeout(() => {
        const savedLanguage = localStorage.getItem(
          "app_language"
        );

        if (!savedLanguage) {
          navigate("/select-language");
          return;
        }

        if (roleName === "DIRECTOR") {
          navigate("/director-dashboard");
        } else if (roleName === "SUPERVISOR") {
          navigate("/supervisor-dashboard");
        } else if (roleName === "MANAGER") {
          navigate("/manager-dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage = String(
        error?.message || ""
      );

      const isNetworkError =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("ECONNREFUSED");

      setMessage(
        isNetworkError
          ? "Backend server not connected ❌"
          : errorMessage || "Login failed ❌"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-wrapper">
          <img
            src="/logo.png"
            alt="SSS FMS Logo"
            className="login-logo-image"
          />
        </div>

        <h1>{t("auth.loginTitle")}</h1>

        <p className="subtitle">
          {t("auth.subtitle")}
        </p>

        <p className="version">
          {t("auth.version")}
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="employeeId">
              {t("auth.employeeId")}
            </label>

            <input
              id="employeeId"
              type="text"
              placeholder="Enter Employee ID"
              value={employeeId}
              onChange={(event) =>
                setEmployeeId(event.target.value)
              }
              autoComplete="username"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="role">
              Select Role
            </label>

            <select
              id="role"
              className="role-select"
              value={role}
              onChange={(event) =>
                setRole(event.target.value)
              }
              required
            >
              <option value="">
                Select Role
              </option>

              <option value="EMPLOYEE">
                Employee
              </option>

              <option value="MANAGER">
                Manager
              </option>

              <option value="DIRECTOR">
                Director
              </option>

              <option value="SUPERVISOR">
                Supervisor
              </option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-box">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter Password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="eye-icon"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (previousValue) =>
                      !previousValue
                  )
                }
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Logging in..."
              : t("auth.login")}
          </button>

          {message && (
            <p
              className={`message ${
                message.includes("Successful")
                  ? "success"
                  : "error"
              }`}
            >
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
            {t("auth.rememberMe")}
          </label>
        </div>

        <a
          href="#forgot-password"
          className="forgot-link"
          onClick={(event) => {
            event.preventDefault();

            alert(
              "Please contact Administrator\n\nEmail: anantavathore@sssfmsindia.com"
            );
          }}
        >
          Forgot Password?
        </a>

        <p className="signup-link">
          New Employee?{" "}

          <button
            type="button"
            className="signup-button"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;