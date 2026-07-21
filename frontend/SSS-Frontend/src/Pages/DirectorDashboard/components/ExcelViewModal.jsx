import React, { useRef } from "react";
import "./ExcelUploadHistoryTable.css";

function isSectionRow(firstCellValue) {
  if (!firstCellValue || typeof firstCellValue !== "string") return false;
  const val = firstCellValue.trim().toLowerCase();
  const sectionKeywords = [
    "housekeeping", "building area", "club house", "security",
    "supervisor", "manager", "technician", "gardener", "cleaner",
    "watchman", "operator", "worker", "staff", "department",
    "section", "area", "zone", "floor", "wing", "block",
  ];
  return sectionKeywords.some((kw) => val.includes(kw));
}

function isTotalRow(firstCellValue) {
  if (!firstCellValue || typeof firstCellValue !== "string") return false;
  return firstCellValue.trim().toLowerCase().includes("total");
}

function isNumeric(value) {
  if (value === null || value === undefined || value === "") return false;
  const str = String(value).trim();
  return !isNaN(Number(str)) && str !== "";
}

function ExcelViewModal({
  open,
  title = "Staff Allocation Details",
  rows = [],
  loading = false,
  onClose,
}) {
  const tableRef = useRef(null);

  if (!open) return null;

  const is2D = Array.isArray(rows[0]);

  const headers = is2D
    ? rows[0] || []
    : rows.length > 0
    ? Object.keys(rows[0] || {})
    : [];

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const getCellValue = (row, colIndex) => {
    if (is2D) {
      return row[colIndex];
    }
    return row?.[headers[colIndex]];
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "height=600,width=900");
    if (!printWindow) return;

    const tableElement = tableRef.current;
    if (!tableElement) return;

    const style = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write([
      '<html><head><title>', title, '</title>',
      '<style>', style, '</style>',
      '<style>',
      'body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      'table { border-collapse: collapse; width: 100%; }',
      'th, td { border: 1px solid #000; padding: 8px; font-size: 12px; }',
      '@page { size: landscape; }',
      '</style></head><body>',
      '<h2 style="margin-bottom:16px;font-size:18px;">', title, '</h2>',
      tableElement.outerHTML,
      '</body></html>',
    ].join(""));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const dataRows = is2D ? rows.slice(1) : rows;

  return (
    <div className="excel-view-overlay" onClick={onClose}>
      <div className="excel-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="excel-view-header">
          <h2>{title}</h2>
          <div className="excel-view-header-actions">
            <button
              type="button"
              className="excel-view-print-btn"
              onClick={handlePrint}
            >
              🖨️ <span>Print</span>
            </button>
<button
              type="button"
              className="excel-view-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        {loading ? (
          <div className="excel-view-loading">Loading table data...</div>
        ) : dataRows.length === 0 ? (
          <div className="excel-view-loading">No data available</div>
        ) : (
          <div className="excel-view-table-wrapper">
            <table className="excel-view-table" ref={tableRef}>
              <thead>
                <tr>
                  {headers.map((h, i) => {
                    const key = is2D ? String(h) + i : String(h);
                    return <th key={key}>{renderCellValue(h)}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIdx) => {
                  const firstCell = getCellValue(row, 0);
                  const firstVal = renderCellValue(firstCell);
                  const isSection = isSectionRow(firstVal);
                  const isTotal = isTotalRow(firstVal);

                  let className = "";
                  if (isSection) className = "excel-view-section-row";
                  else if (isTotal) className = "excel-view-total-row";

                  return (
                    <tr key={rowIdx} className={className}>
                      {headers.map((h, colIdx) => {
                        const cellValue = getCellValue(row, colIdx);
                        const cellText = renderCellValue(cellValue);
                        const cellKey = is2D ? `${rowIdx}-${colIdx}` : `${rowIdx}-${String(h)}`;

                        let cellClassName = "";
                        if (isNumeric(cellValue) && colIdx > 0) {
                          cellClassName = "excel-view-numeric-cell";
                        }

                        return (
                          <td key={cellKey} className={cellClassName}>
                            {cellText}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExcelViewModal;
