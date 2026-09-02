package com.company.taskmanagement.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.AttendanceRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class SupervisorAttendanceService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessService accessService;

    public Attendance punchIn(
            User supervisor,
            Long employeeId,
            String photoPath,
            String location,
            Double latitude,
            Double longitude) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(supervisor, employee);

        LocalDate today = LocalDate.now(INDIA_ZONE);

        Attendance attendance =
                attendanceRepository.findTopByUserIdAndAttendanceDateOrderByIdDesc(
                        employee.getId(),
                        today
                );

        if (attendance != null && attendance.getCheckInTime() != null) {
            throw new RuntimeException(
                    "Punch In already recorded for " + employee.getName()
            );
        }

        if (attendance == null) {
            attendance = new Attendance();
            attendance.setUser(employee);
            attendance.setAttendanceDate(today);
        }

        attendance.setCheckInTime(LocalTime.now(INDIA_ZONE));
        attendance.setStatus("PRESENT");
        attendance.setAttendanceMode("SUPERVISOR_PHOTO");
        attendance.setMarkedByUserId(supervisor.getId());
        attendance.setSupervisorVerified(true);

        if (photoPath != null && !photoPath.isBlank()) {
            attendance.setCheckInSelfiePath(photoPath);
        }

        if (location != null && !location.isBlank()) {
            attendance.setLocation(location);
        }

        attendance.setLatitude(latitude);
        attendance.setLongitude(longitude);

        return attendanceRepository.save(attendance);
    }

    public Attendance punchOut(
            User supervisor,
            Long employeeId,
            String photoPath,
            String location,
            Double latitude,
            Double longitude) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(supervisor, employee);

        LocalDate today = LocalDate.now(INDIA_ZONE);

        Attendance attendance =
                attendanceRepository.findTopByUserIdAndAttendanceDateOrderByIdDesc(
                        employee.getId(),
                        today
                );

        if (attendance == null || attendance.getCheckInTime() == null) {
            throw new RuntimeException(
                    "Punch In is required before Punch Out"
            );
        }

        if (attendance.getCheckOutTime() != null) {
            throw new RuntimeException(
                    "Punch Out already recorded for " + employee.getName()
            );
        }

        LocalTime outTime = LocalTime.now(INDIA_ZONE);
        attendance.setCheckOutTime(outTime);

        if (photoPath != null && !photoPath.isBlank()) {
            attendance.setCheckOutSelfiePath(photoPath);
        }

        if (location != null && !location.isBlank()) {
            attendance.setLocation(location);
        }

        attendance.setLatitude(latitude);
        attendance.setLongitude(longitude);

        long minutes = Duration.between(
                attendance.getCheckInTime(),
                outTime
        ).toMinutes();

        attendance.setWorkingHours(minutes / 60.0);

        if (!"HOLIDAY".equals(attendance.getStatus())
                && !"HALF_DAY".equals(attendance.getStatus())
                && !"WEEK_OFF".equals(attendance.getStatus())) {

            attendance.setStatus("COMPLETED");
        }

        attendance.setAttendanceMode("SUPERVISOR_PHOTO");
        attendance.setMarkedByUserId(supervisor.getId());
        attendance.setSupervisorVerified(true);

        return attendanceRepository.save(attendance);
    }

    public Attendance updateStatus(
            User supervisor,
            Long employeeId,
            String status,
            String location) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(supervisor, employee);

        String normalized =
                status == null ? "" : status.trim().toUpperCase();

        if (!List.of(
                "PRESENT",
                "HALF_DAY",
                "WEEK_OFF",
                "HOLIDAY"
        ).contains(normalized)) {

            throw new RuntimeException("Invalid attendance status");
        }

        LocalDate today = LocalDate.now(INDIA_ZONE);

        Attendance attendance =
                attendanceRepository.findTopByUserIdAndAttendanceDateOrderByIdDesc(
                        employee.getId(),
                        today
                );

        if (attendance == null) {
            attendance = new Attendance();
            attendance.setUser(employee);
            attendance.setAttendanceDate(today);
        }

        attendance.setStatus(normalized);
        attendance.setAttendanceMode("SUPERVISOR_PHOTO");
        attendance.setMarkedByUserId(supervisor.getId());

        if (location != null && !location.isBlank()) {
            attendance.setLocation(location);
        }

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getEmployeeHistory(
            User supervisor,
            Long employeeId) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(supervisor, employee);

        return attendanceRepository.findByUserId(employee.getId());
    }
}