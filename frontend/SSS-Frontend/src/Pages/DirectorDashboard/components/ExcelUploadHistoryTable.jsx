import React from "react";
import "./ExcelUploadHistoryTable.css";

function ExcelUploadHistoryTable({
  rows = [],
  type,
  onView,
  onDownload,
  onPrint,
}) {
  return (
    <div className="excel-history-table-wrap">
      <table className="excel-history-table">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Uploaded By</th>
            <th>Upload Date</th>
            <th>File Size</th>
            <th>Total Records</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="excel-history-empty">
                No uploads found
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const id = r?.id;
              return (
                <tr key={id || r?.fileName || Math.random()}>
                  <td>{r?.fileName || r?.originalFileName || "-"}</td>
                  <td>{r?.uploadedByName || r?.uploadedBy || "-"}</td>
                  <td>{r?.uploadDate || r?.createdAt || "-"}</td>
                  <td>
                    {typeof r?.fileSize === "number"
                      ? `${r.fileSize} B`
                      : r?.fileSize || "-"}
                  </td>
                  <td>{r?.totalRecords ?? r?.records ?? "-"}</td>
                  <td>{r?.status || "-"}</td>
                  <td>
                    <div className="excel-history-actions">
                      <button
                        type="button"
                        className="excel-history-action"
                        onClick={() => onView?.(id)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="excel-history-action"
                        onClick={() => onDownload?.(id)}
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        className="excel-history-action"
                        onClick={() => {
                          onView?.(id);
                          setTimeout(() => onPrint?.(), 250);
                        }}
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ExcelUploadHistoryTable;

