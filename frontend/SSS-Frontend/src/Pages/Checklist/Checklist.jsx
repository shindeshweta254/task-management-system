import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import "./Checklist.css";
import {
  FaEdit,
  FaTrash,
  FaPrint,
  FaSave,
  FaEye,
  FaDownload,
} from "react-icons/fa";

function Checklist() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [checklist, setChecklist] = useState([]);
  const [sheetName, setSheetName] = useState("Daily Checklist");

  const [siteInfo, setSiteInfo] = useState({
    siteName: "Purvankra",
    building: "Silver Park - Tower A",
    location: "Silver Park Society, Pune",
    month: "July - 2026",
    date: new Date().toISOString().split("T")[0],
    supervisor: user.name || "Supervisor",
    shift: "Morning",
    reviewer: "Facility Manager",
  });

  const [entries, setEntries] = useState({});

  useEffect(() => {
    loadChecklist(sheetName);
  }, [sheetName]);

  const loadChecklist = async (sheet) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/checklist-master/sheet?sheetName=${encodeURIComponent(
          sheet
        )}`
      );
      const data = await response.json();
      setChecklist(data);
    } catch (error) {
      console.log(error);
    }
  };

  const updateEntry = (id, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const getStatus = (id) => entries[id]?.status || "Pending";

  const summary = {
    total: checklist.length,
    yes: Object.values(entries).filter((e) => e.status === "Yes").length,
    no: Object.values(entries).filter((e) => e.status === "No").length,
    progress: Object.values(entries).filter((e) => e.status === "In Progress")
      .length,
    na: Object.values(entries).filter((e) => e.status === "NA").length,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const data = {
      sheetName,
      siteInfo,
      entries,
      checklist,
      savedAt: new Date().toLocaleString(),
    };

    localStorage.setItem("savedChecklist", JSON.stringify(data));
    alert("Checklist saved successfully!");
  };

  const handleSubmitReview = () => {
    alert("Checklist submitted for review!");
  };

  const handlePreview = () => {
    const previewWindow = window.open("", "_blank");

    previewWindow.document.write(`
      <html>
        <head>
          <title>Checklist Preview</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #5b2bd8; text-align:center; }
            table { width:100%; border-collapse:collapse; margin-top:20px; }
            th, td { border:1px solid #ccc; padding:8px; text-align:center; }
            th { background:#5b2bd8; color:white; }
          </style>
        </head>
        <body>
          <h1>SSS FACILITY SERVICES</h1>
          <h2>${sheetName}</h2>
          <p><b>Site:</b> ${siteInfo.siteName}</p>
          <p><b>Building:</b> ${siteInfo.building}</p>
          <p><b>Location:</b> ${siteInfo.location}</p>
          <p><b>Month:</b> ${siteInfo.month}</p>

          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Section</th>
                <th>Task</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${checklist
                .map(
                  (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.sectionName || "-"}</td>
                    <td>${item.checkPoint || "-"}</td>
                    <td>${item.frequency || "Daily"}</td>
                    <td>${getStatus(item.id)}</td>
                    <td>${entries[item.id]?.remark || "-"}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);

    previewWindow.document.close();
  };

  const handleDownloadExcel = () => {
    let csv =
      "Sr No,Section,Task,Frequency,Status,Remark\n";

    checklist.forEach((item, index) => {
      csv += `${index + 1},"${item.sectionName || "-"}","${
        item.checkPoint || "-"
      }","${item.frequency || "Daily"}","${getStatus(item.id)}","${
        entries[item.id]?.remark || "-"
      }"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheetName}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Checklist">
      <div className="checklist-wrapper">
        <div className="checklist-top-actions">
          <select
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          >
            <option>Daily Checklist</option>
            <option>Frequency Checklist</option>
            <option>Supervisor Check list</option>
            <option>Shift Supervisor Checklist</option>
            <option>Daily Electrical Checklist</option>
            <option>Daily Water Supply</option>
            <option>Water Tanker Supply</option>
            <option>Jobcard</option>
            <option>Swimming Pool Checklist</option>
          </select>

          <input
            type="date"
            value={siteInfo.date}
            onChange={(e) =>
              setSiteInfo({ ...siteInfo, date: e.target.value })
            }
          />

          <button className="print-btn" onClick={handlePrint}>
            <FaPrint /> Print / PDF
          </button>
        </div>

        <div className="checklist-sheet">
          <div className="excel-header">
            <div className="excel-logo">
              <div className="sss-logo">SSS</div>
              <p>
                SSS Facility
                <br />
                Services
              </p>
            </div>

            <div className="excel-title">
              <h1>SSS FACILITY SERVICES</h1>
              <h2>{sheetName.toUpperCase()}</h2>
            </div>
          </div>

          <div className="site-grid">
            <div>
              <b>Site Name :</b>
              <input
                value={siteInfo.siteName}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, siteName: e.target.value })
                }
              />
            </div>

            <div>
              <b>Building / Tower :</b>
              <input
                value={siteInfo.building}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, building: e.target.value })
                }
              />
            </div>

            <div>
              <b>Location :</b>
              <input
                value={siteInfo.location}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, location: e.target.value })
                }
              />
            </div>

            <div>
              <b>Month :</b>
              <input
                value={siteInfo.month}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, month: e.target.value })
                }
              />
            </div>

            <div>
              <b>Supervisor :</b>
              <input
                value={siteInfo.supervisor}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, supervisor: e.target.value })
                }
              />
            </div>

            <div>
              <b>Shift :</b>
              <select
                value={siteInfo.shift}
                onChange={(e) =>
                  setSiteInfo({ ...siteInfo, shift: e.target.value })
                }
              >
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </div>
          </div>

          <div className="note-box">
            ℹ️ This checklist is updated daily and monthly report will be sent
            to Site Owner.
          </div>

          <table className="checklist-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Section</th>
                <th>Check Point / Task</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {checklist.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.sectionName || "-"}</td>
                  <td className="task-text">{item.checkPoint}</td>
                  <td>{item.frequency || "Daily"}</td>

                  <td>
                    <select
                      className={`status-select ${getStatus(item.id)
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                      value={getStatus(item.id)}
                      onChange={(e) =>
                        updateEntry(item.id, "status", e.target.value)
                      }
                    >
                      <option>Pending</option>
                      <option>Yes</option>
                      <option>No</option>
                      <option>In Progress</option>
                      <option>NA</option>
                    </select>
                  </td>

                  <td>
                    <input
                      className="remark-input"
                      placeholder="Remark"
                      value={entries[item.id]?.remark || ""}
                      onChange={(e) =>
                        updateEntry(item.id, "remark", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <button
                      className="icon-btn edit"
                      onClick={() => alert("Edit clicked")}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="icon-btn delete"
                      onClick={() => alert("Delete clicked")}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bottom-panels">
            <div className="summary-card">
              <h3>Monthly Summary</h3>
              <p>
                Total Tasks: <b>{summary.total}</b>
              </p>
              <p className="green">
                Completed Yes: <b>{summary.yes}</b>
              </p>
              <p className="blue">
                In Progress: <b>{summary.progress}</b>
              </p>
              <p className="red">
                Not Completed No: <b>{summary.no}</b>
              </p>
              <p>
                NA: <b>{summary.na}</b>
              </p>
            </div>

            <div className="summary-card">
              <h3>Site / Building Information</h3>
              <p>
                Site: <b>{siteInfo.siteName}</b>
              </p>
              <p>
                Building: <b>{siteInfo.building}</b>
              </p>
              <p>
                Location: <b>{siteInfo.location}</b>
              </p>
              <p>
                Month: <b>{siteInfo.month}</b>
              </p>
            </div>
          </div>

          <div className="checklist-actions">
            <button className="save-btn" onClick={handleSave}>
              <FaSave /> Save Checklist
            </button>

            <button className="review-btn" onClick={handleSubmitReview}>
              Submit for Review
            </button>

            <button className="preview-btn" onClick={handlePreview}>
              <FaEye /> Preview Report
            </button>

            <button className="download-btn" onClick={handleDownloadExcel}>
              <FaDownload /> Download Excel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Checklist;