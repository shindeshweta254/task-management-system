package com.company.taskmanagement.dto;

import java.time.LocalDateTime;

public class ExcelUploadHistoryResponse {

    public String uploadType; // STAFF or PROJECT

    public Long id;

    public String originalFileName;

    public String uploadedByName;

    public Long uploadedByUserId;

    public String uploadDate; // ISO string

    public Long fileSize;

    public Long totalRecords;

    public String status; // SUCCESS/FAILED

    public String siteName; // for projects

    public ExcelUploadHistoryResponse() {}

    public static ExcelUploadHistoryResponse ofStaff(
            Long id,
            String originalFileName,
            String uploadedByName,
            Long uploadedByUserId,
            LocalDateTime uploadDate,
            Long fileSize,
            Long totalRecords,
            String status) {
        ExcelUploadHistoryResponse r = new ExcelUploadHistoryResponse();
        r.uploadType = "STAFF";
        r.id = id;
        r.originalFileName = originalFileName;
        r.uploadedByName = uploadedByName;
        r.uploadedByUserId = uploadedByUserId;
        r.uploadDate = uploadDate != null ? uploadDate.toString() : null;
        r.fileSize = fileSize;
        r.totalRecords = totalRecords;
        r.status = status;
        r.siteName = null;
        return r;
    }

    public static ExcelUploadHistoryResponse ofProject(
            Long id,
            String originalFileName,
            String uploadedByName,
            Long uploadedByUserId,
            String siteName,
            LocalDateTime uploadDate,
            Long fileSize,
            Long totalRecords,
            String status) {
        ExcelUploadHistoryResponse r = new ExcelUploadHistoryResponse();
        r.uploadType = "PROJECT";
        r.id = id;
        r.originalFileName = originalFileName;
        r.uploadedByName = uploadedByName;
        r.uploadedByUserId = uploadedByUserId;
        r.siteName = siteName;
        r.uploadDate = uploadDate != null ? uploadDate.toString() : null;
        r.fileSize = fileSize;
        r.totalRecords = totalRecords;
        r.status = status;
        return r;
    }
}

