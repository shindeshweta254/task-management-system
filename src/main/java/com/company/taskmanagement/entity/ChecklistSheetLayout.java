package com.company.taskmanagement.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Persists the column layout / custom sheet definition for a checklist.
 *
 * Used by "New Checklist" (Save) and the master layout loader in
 * Checklist.jsx. Table is auto-created via hibernate ddl-auto=update.
 */
@Entity
@Table(name = "checklist_sheet_layout")
public class ChecklistSheetLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // MASTER or CUSTOM
    private String kind;

    private String sheetName;

    @Column(length = 4000)
    private String columnsJson;

    @Column(length = 4000)
    private String rowsJson;

    private String siteName;

    private LocalDate reportDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getSheetName() { return sheetName; }
    public void setSheetName(String sheetName) { this.sheetName = sheetName; }

    public String getColumnsJson() { return columnsJson; }
    public void setColumnsJson(String columnsJson) { this.columnsJson = columnsJson; }

    public String getRowsJson() { return rowsJson; }
    public void setRowsJson(String rowsJson) { this.rowsJson = rowsJson; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }
}
