package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.dto.AttendanceReportDTO;
import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.AttendanceRepository;
import com.company.taskmanagement.repository.ReportRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class AttendanceReportService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessService accessService;

    /**
     * Build aggregated attendance reports with human-readable addresses.
     * Latitude/longitude remain available internally for map views.
     * Address is sourced from the Report entity's locationAddress field.
     */
    public List<AttendanceReportDTO> getAttendanceReports(
            User currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String siteFilter,
            Long employeeIdFilter,
            String departmentFilter,
            String statusFilter) {

        // Get all attendance records
        List<Attendance> allAttendance = attendanceRepository.findAll();

        // Filter by date range
        List<Attendance> filtered = allAttendance.stream()
                .filter(a -> a.getAttendanceDate() != null)
                .filter(a -> startDate == null || !a.getAttendanceDate().isBefore(startDate))
                .filter(a -> endDate == null || !a.getAttendanceDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Build DTOs with access validation
        return filtered.stream()
                .map(a -> {
                    User user = a.getUser();
                    if (user == null) return null;

                    // Authorization: Employee sees own, supervisor sees site, SP002/SP001 sees all
                    try {
                        accessService.validateTargetEmployee(currentUser, user);
                    } catch (Exception e) {
                        return null;
                    }

                    // Apply additional filters
                    if (siteFilter != null && !siteFilter.isBlank()
                            && !user.getSiteCode().equalsIgnoreCase(siteFilter.trim())) {
                        return null;
                    }
                    if (employeeIdFilter != null
                            && !user.getId().equals(employeeIdFilter)) {
                        return null;
                    }
                    if (departmentFilter != null && !departmentFilter.isBlank()
                            && (user.getDepartment() == null
                            || !user.getDepartment().equalsIgnoreCase(departmentFilter.trim()))) {
                        return null;
                    }
                    if (statusFilter != null && !statusFilter.isBlank()
                            && (a.getStatus() == null
                            || !a.getStatus().equalsIgnoreCase(statusFilter.trim()))) {
                        return null;
                    }

                    // Get the most recent report for this user on that date for address
                    Report report = null;
                    List<Report> userReports = reportRepository.findByUserId(user.getId());
                    if (userReports != null && !userReports.isEmpty()) {
                        report = userReports.stream()
                                .filter(r -> r.getReportDate() != null
                                        && r.getReportDate().equals(a.getAttendanceDate()))
                                .findFirst()
                                .orElse(userReports.get(userReports.size() - 1));
                    }

                    return AttendanceReportDTO.fromAttendanceAndReport(a, report, user);
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    /**
     * Live location: Updates the latest report's location for the current user.
     * Controlled update (not every second). Frontend should call every 30-60 seconds.
     */
    public Report updateLiveLocation(Long userId, Double latitude, Double longitude, String locationAddress) {
        // Find the most recent report for this user to update its live location
        List<Report> userReports = reportRepository.findByUserId(userId);
        Report latestReport;
        if (userReports.isEmpty()) {
            // Create a placeholder report for live location tracking
            latestReport = new Report();
            latestReport.setUser(new User());
            latestReport.getUser().setId(userId);
            latestReport.setReportDate(LocalDate.now());
        } else {
            latestReport = userReports.get(userReports.size() - 1);
        }
        latestReport.setLatitude(latitude);
        latestReport.setLongitude(longitude);
        latestReport.setLocationAddress(locationAddress);
        return reportRepository.save(latestReport);
    }

    /**
     * Get live location for a specific user (authorized).
     */
    public Report getLiveLocation(User currentUser, Long targetUserId) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        accessService.validateTargetEmployee(currentUser, targetUser);

        List<Report> userReports = reportRepository.findByUserId(targetUserId);
        if (userReports.isEmpty()) {
            return null;
        }
        // Return the latest report which has the most recent location
        return userReports.get(userReports.size() - 1);
    }
}

