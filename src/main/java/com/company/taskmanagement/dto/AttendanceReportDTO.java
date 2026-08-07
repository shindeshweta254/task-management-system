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
    private String roleName;
    private String site;
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private Double workingHours;
    private String status;

// Location from attendance table directly
    private String location;

    // Human-readable addresses (from Report entity)
    private String checkInAddress;
    private String checkOutAddress;
    private String latestLiveAddress;

    // Coordinates (internal for map accuracy, not primary display)
    private Double latitude;
    private Double longitude;

// Selfie / proof file (from Attendance record - punch in/out selfies)
    private String checkInSelfieUrl;
    private String checkOutSelfieUrl;

    public static AttendanceReportDTO fromAttendanceAndReport(Attendance attendance, Report report, User user) {
        AttendanceReportDTO dto = new AttendanceReportDTO();
        dto.attendanceId = attendance.getId();
        dto.employeeName = user != null ? user.getName() : "Unknown";
        dto.employeeId = user != null ? user.getEmployeeId() : "";
        dto.roleName = user != null && user.getRole() != null ? user.getRole().getRoleName() : "";
        dto.site = user != null ? user.getSiteCode() : "";
        dto.date = attendance.getAttendanceDate();
        dto.checkInTime = attendance.getCheckInTime();
        dto.checkOutTime = attendance.getCheckOutTime();
        dto.workingHours = attendance.getWorkingHours();
        dto.status = attendance.getStatus();
        dto.location = attendance.getLocation();

// Use attendance punch-in/punch-out selfie paths only.
        // Convert relative file path to accessible URL path (e.g. uploads/attendance/xxx.jpg).
        dto.checkInSelfieUrl = toSelfieUrl(attendance.getCheckInSelfiePath());
        dto.checkOutSelfieUrl = toSelfieUrl(attendance.getCheckOutSelfiePath());

      
        dto.latestLiveAddress = attendance.getLocation();

        // Fall back to report address only if attendance has no live location.
        if (report != null) {
            dto.checkInAddress = report.getLocationAddress();
            dto.checkOutAddress = report.getLocationAddress();
            if (dto.latitude == null) dto.latitude = report.getLatitude();
            if (dto.longitude == null) dto.longitude = report.getLongitude();
            if ((dto.latestLiveAddress == null || dto.latestLiveAddress.isBlank()) && report.getLocationAddress() != null) {
                dto.latestLiveAddress = report.getLocationAddress();
            }
        }

        return dto;
    }

    /**
     * Convert a stored selfie file path (e.g. uploads/attendance/123.jpg) into
     * a URL-accessible path relative to the backend root.
     */
    private static String toSelfieUrl(String path) {
        if (path == null || path.isBlank()) {
            return null;
        }
        // Normalize Windows backslashes to forward slashes
        String normalized = path.replace("\\", "/");
        // If it already starts with uploads/, serve via static handler
        if (normalized.startsWith("uploads/")) {
            return "/" + normalized;
        }
        // If it's a bare filename, assume it's under uploads/attendance/
        if (!normalized.contains("/")) {
            return "/uploads/attendance/" + normalized;
        }
        // Otherwise wrap as-is
        if (!normalized.startsWith("/")) {
            return "/" + normalized;
        }
        return normalized;
    }

    public Long getAttendanceId() { return attendanceId; }
    public void setAttendanceId(Long attendanceId) { this.attendanceId = attendanceId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

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

public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

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

public String getCheckInSelfieUrl() { return checkInSelfieUrl; }
    public void setCheckInSelfieUrl(String checkInSelfieUrl) { this.checkInSelfieUrl = checkInSelfieUrl; }

    public String getCheckOutSelfieUrl() { return checkOutSelfieUrl; }
    public void setCheckOutSelfieUrl(String checkOutSelfieUrl) { this.checkOutSelfieUrl = checkOutSelfieUrl; }
}

