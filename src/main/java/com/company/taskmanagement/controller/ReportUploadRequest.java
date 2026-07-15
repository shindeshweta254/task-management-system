package com.company.taskmanagement.controller;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

/**
 * Helper DTO for daily work proof upload.
 */
public class ReportUploadRequest {

    private String completedWork;
    private String pendingWork;
    private String issues;
    private LocalDate reportDate;

    private Double latitude;
    private Double longitude;
    private String locationAddress;

    // Multipart proof file
    private MultipartFile proof;

    public String getCompletedWork() {
        return completedWork;
    }

    public void setCompletedWork(String completedWork) {
        this.completedWork = completedWork;
    }

    public String getPendingWork() {
        return pendingWork;
    }

    public void setPendingWork(String pendingWork) {
        this.pendingWork = pendingWork;
    }

    public String getIssues() {
        return issues;
    }

    public void setIssues(String issues) {
        this.issues = issues;
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }

    public MultipartFile getProof() {
        return proof;
    }

    public void setProof(MultipartFile proof) {
        this.proof = proof;
    }
}

