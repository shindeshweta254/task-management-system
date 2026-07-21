import { useNavigate } from "react-router-dom";
import "./BackButton.css";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="global-back-button"
      onClick={() => navigate(-1)}
      aria-label="Go to previous page"
    >
      <span aria-hidden="true">←</span>
    </button>
  );
}

export default BackButton;

