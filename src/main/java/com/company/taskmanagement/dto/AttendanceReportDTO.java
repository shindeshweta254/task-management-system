package com.company.taskmanagement.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.entity.User;

/**
 * Aggregated DTO for attendance reports with human-readable address.
 * Latitude/longitude remain available internally for map views.
 */
public class AttendanceReportDTO {

    private Long attendanceId;
    private String employeeName;
    private String employeeId;
    private String site;
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Double workingHours;
    private String status;

    // Human-readable addresses (from Report entity)
    private String checkInAddress;
    private String checkOutAddress;
    private String latestLiveAddress;

    // Coordinates (internal for map accuracy, not primary display)
    private Double latitude;
    private Double longitude;

    // Selfie / proof file
    private String selfieFileName;
    private String selfieFilePath;

    public static AttendanceReportDTO fromAttendanceAndReport(Attendance attendance, Report report, User user) {
        AttendanceReportDTO dto = new AttendanceReportDTO();
        dto.attendanceId = attendance.getId();
        dto.employeeName = user != null ? user.getName() : "Unknown";
        dto.employeeId = user != null ? user.getEmployeeId() : "";
        dto.site = user != null ? user.getSiteCode() : "";
        dto.date = attendance.getAttendanceDate();
        dto.checkInTime = attendance.getCheckInTime();
        dto.checkOutTime = attendance.getCheckOutTime();
        dto.workingHours = attendance.getWorkingHours();
        dto.status = attendance.getStatus();

        // Try to get address from the report (daily report has locationAddress)
        if (report != null) {
            dto.checkInAddress = report.getLocationAddress();
            dto.checkOutAddress = report.getLocationAddress();
            dto.latestLiveAddress = report.getLocationAddress();
            dto.latitude = report.getLatitude();
            dto.longitude = report.getLongitude();
            dto.selfieFileName = report.getProofFileName();
            dto.selfieFilePath = report.getProofFilePath();
        }

        return dto;
    }

    public Long getAttendanceId() { return attendanceId; }
    public void setAttendanceId(Long attendanceId) { this.attendanceId = attendanceId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalTime checkInTime) { this.checkInTime = checkInTime; }

    public LocalTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalTime checkOutTime) { this.checkOutTime = checkOutTime; }

    public Double getWorkingHours() { return workingHours; }
    public void setWorkingHours(Double workingHours) { this.workingHours = workingHours; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCheckInAddress() { return checkInAddress; }
    public void setCheckInAddress(String checkInAddress) { this.checkInAddress = checkInAddress; }

    public String getCheckOutAddress() { return checkOutAddress; }
    public void setCheckOutAddress(String checkOutAddress) { this.checkOutAddress = checkOutAddress; }

    public String getLatestLiveAddress() { return latestLiveAddress; }
    public void setLatestLiveAddress(String latestLiveAddress) { this.latestLiveAddress = latestLiveAddress; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getSelfieFileName() { return selfieFileName; }
    public void setSelfieFileName(String selfieFileName) { this.selfieFileName = selfieFileName; }

    public String getSelfieFilePath() { return selfieFilePath; }
    public void setSelfieFilePath(String selfieFilePath) { this.selfieFilePath = selfieFilePath; }
}

