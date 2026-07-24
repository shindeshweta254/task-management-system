package com.company.taskmanagement.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.AttendanceReportDTO;
import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.AttendanceReportService;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Controller for attendance reports with human-readable addresses,
 * live location tracking, and filtered report views.
 * 
 * DB SCHEMA BLOCKER NOTE:
 * The Attendance entity does NOT have fields for:
 *   - checkInAddress / checkOutAddress
 *   - selfie path
 *   - live latitude/longitude
 * 
 * SOLUTION: The Report entity already has latitude, longitude, locationAddress,
 * proofFileName, and proofFilePath. We reuse these as the source for address/selfie.
 * 
 * For per-attendance location, the existing database schema is insufficient.
 * The Report entity's location fields are used as the best available source.
 */
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/attendance-reports")
public class AttendanceReportController {

    @Autowired
    private AttendanceReportService attendanceReportService;

    @Autowired
    private AccessService accessService;

    /**
     * GET /api/attendance-reports?startDate=...&endDate=...&site=...&employee=...&department=...&status=...
     * 
     * Returns filtered attendance records with human-readable address (from Report.locationAddress).
     * Coordinates remain internal for map accuracy.
     */
    @GetMapping
    public List<AttendanceReportDTO> getReports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String site,
            @RequestParam(required = false) Long employee,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        return attendanceReportService.getAttendanceReports(
                currentUser, startDate, endDate, site, employee, department, status);
    }

    /**
     * POST /api/attendance-reports/live-location
     * Body: { "userId": 123, "latitude": 19.123, "longitude": 72.123, "locationAddress": "Mumbai, India" }
     * 
     * Controlled live-location update (call every 30-60 seconds from frontend).
     * Starts after punch-in, stops after punch-out.
     * Stores latest available location in the Report entity.
     */
    @PostMapping("/live-location")
    public Report updateLiveLocation(
            @RequestBody LiveLocationRequest body,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        if (!currentUser.getId().equals(body.getUserId())) {
            throw new com.company.taskmanagement.exception.ForbiddenException(
                    "You can only update your own live location");
        }
        return attendanceReportService.updateLiveLocation(
                body.getUserId(), body.getLatitude(), body.getLongitude(), body.getLocationAddress());
    }

    /**
     * GET /api/attendance-reports/live-location/{userId}
     * Get the latest known location for a specific user.
     * Authorization: Employee sees own, supervisor sees permitted-site employees.
     */
    @GetMapping("/live-location/{userId}")
    public Report getLiveLocation(
            @PathVariable Long userId,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        return attendanceReportService.getLiveLocation(currentUser, userId);
    }

    /**
     * Request body for live location updates.
     */
    public static class LiveLocationRequest {
        private Long userId;
        private Double latitude;
        private Double longitude;
        private String locationAddress;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getLocationAddress() { return locationAddress; }
        public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }
    }
}

