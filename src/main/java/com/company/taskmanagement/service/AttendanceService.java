package com.company.taskmanagement.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.dto.AttendanceReportDTO;
import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.AttendanceRepository;
import com.company.taskmanagement.repository.ReportRepository;

@Service
public class AttendanceService {

	@Autowired
	private AttendanceRepository attendanceRepository;

	@Autowired
	private ReportRepository reportRepository;

	public Attendance checkIn(Attendance attendance) {

		attendance.setAttendanceDate(LocalDate.now());
		attendance.setCheckInTime(LocalTime.now());
		attendance.setStatus("PRESENT");

		return attendanceRepository.save(attendance);
	}

	public List<Attendance> getAllAttendance() {

		return attendanceRepository.findAll();
	}

	public List<Attendance> getAttendanceByUser(Long userId) {

		return attendanceRepository.findByUserId(userId);
	}

	public Attendance checkOut(Long attendanceId) {

		Attendance attendance = attendanceRepository.findById(attendanceId)
				.orElseThrow(() -> new RuntimeException("Attendance Not Found"));

		attendance.setCheckOutTime(LocalTime.now());

		long minutes = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime()).toMinutes();

		attendance.setWorkingHours(minutes / 60.0);

		return attendanceRepository.save(attendance);
	}

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
	public Attendance getAttendanceById(Long id) {
		return attendanceRepository.findById(id).orElse(null);
	}

	public List<Attendance> getAttendanceBySiteCode(String siteCode) {
		return attendanceRepository.findByUserSiteCode(siteCode);
	}

	public long getTodayAttendanceCountBySiteCode(String siteCode) {
		return attendanceRepository.countByUserSiteCodeAndAttendanceDate(siteCode, LocalDate.now());
	}

	/**
	 * Director attendance view (read-only).
	 * Returns all attendance records of EMPLOYEE and SUPERVISOR users,
	 * enriched with location/selfie data from the Report entity when available.
	 * Sorted by date descending, then employee name ascending.
	 */
	public List<AttendanceReportDTO> getDirectorAttendance() {
		List<Attendance> allAttendance = attendanceRepository.findAll();

		return allAttendance.stream()
				.filter(a -> a.getUser() != null)
				.filter(a -> isEmployeeOrSupervisor(a.getUser()))
				.map(a -> {
					Report report = findReportFor(a.getUser().getId(), a.getAttendanceDate());
					return AttendanceReportDTO.fromAttendanceAndReport(a, report, a.getUser());
				})
				.sorted(Comparator
						.comparing(AttendanceReportDTO::getDate,
								Comparator.nullsLast(Comparator.reverseOrder()))
						.thenComparing(AttendanceReportDTO::getEmployeeName,
								Comparator.nullsLast(Comparator.naturalOrder())))
				.collect(Collectors.toList());
	}

/**
	 * Returns true if the user's role is EMPLOYEE or SUPERVISOR (case-insensitive).
	 */
	private boolean isEmployeeOrSupervisor(User user) {
		Role role = user.getRole();
		if (role == null || role.getRoleName() == null) {
			return false;
		}
		String roleName = role.getRoleName().trim().toUpperCase();
		return roleName.equals("EMPLOYEE") || roleName.equals("SUPERVISOR");
	}

	/**
	 * Returns ALL attendance records for all users (no role filtering).
	 * Enriched with employee name, employee ID, role name, location,
	 * latitude/longitude, and selfie data from the Report entity.
	 * Sorted by date descending, then employee name ascending.
	 */
	public List<AttendanceReportDTO> getAllAttendanceWithDetails() {
		List<Attendance> allAttendance = attendanceRepository.findAll();

		return allAttendance.stream()
				.filter(a -> a.getUser() != null)
				.map(a -> {
					Report report = findReportFor(a.getUser().getId(), a.getAttendanceDate());
					return AttendanceReportDTO.fromAttendanceAndReport(a, report, a.getUser());
				})
				.sorted(Comparator
						.comparing(AttendanceReportDTO::getDate,
								Comparator.nullsLast(Comparator.reverseOrder()))
						.thenComparing(AttendanceReportDTO::getEmployeeName,
								Comparator.nullsLast(Comparator.naturalOrder())))
				.collect(Collectors.toList());
	}

	/**
	 * Find the Report (daily work proof) for the given user on the given date.
	 * Report entity holds location address, coordinates, and selfie/proof file.
	 */
	private Report findReportFor(Long userId, LocalDate date) {
		if (userId == null || date == null) {
			return null;
		}
		List<Report> userReports = reportRepository.findByUserId(userId);
		if (userReports == null || userReports.isEmpty()) {
			return null;
		}
		return userReports.stream()
				.filter(r -> r.getReportDate() != null && r.getReportDate().equals(date))
				.findFirst()
				.orElse(userReports.get(userReports.size() - 1));
	}
}
