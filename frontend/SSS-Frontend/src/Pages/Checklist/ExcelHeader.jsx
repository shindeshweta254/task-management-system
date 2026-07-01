import React from "react";
import "./ExcelHeader.css";

function ExcelHeader() {
  return (
    <div className="excel-header">
      <div className="logo-section">
        <div className="logo-circle">
          <span>SSS</span>
        </div>
        <div className="logo-text">FACILITY SERVICES</div>
      </div>

      <div className="header-right">
        <h1>SSS FACILITY SERVICES</h1>

        <div className="details-row">
          <div>Location :- __________________</div>
          <div>Month :- __________________</div>
          <div>Date :- __________________</div>
        </div>
      </div>
    </div>
  );
}

export default ExcelHeader;
