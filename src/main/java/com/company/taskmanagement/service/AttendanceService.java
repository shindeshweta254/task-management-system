package com.company.taskmanagement.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

	private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

        private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

	@Autowired
	private AttendanceRepository attendanceRepository;

	@Autowired
	private ReportRepository reportRepository;

	public Attendance checkIn(Attendance attendance) {

		User user = attendance.getUser();
		LocalDate today = LocalDate.now(INDIA_ZONE);

		Attendance existing = attendanceRepository.findTopByUserIdAndAttendanceDateOrderByIdDesc(user.getId(), today);

		if (existing != null) {

			existing.setCheckInTime(LocalTime.now(INDIA_ZONE));

			if (attendance.getLocation() != null) {
				existing.setLocation(attendance.getLocation());
			}

			if (attendance.getCheckInSelfiePath() != null) {
				existing.setCheckInSelfiePath(attendance.getCheckInSelfiePath());
			}

			// IMPORTANT:
			// Do NOT overwrite HOLIDAY / WEEK_OFF / HALF_DAY
			// Keep existing status

			return attendanceRepository.save(existing);
		}

		attendance.setAttendanceDate(today);
		attendance.setCheckInTime(LocalTime.now(INDIA_ZONE));

		if (attendance.getStatus() == null) {
			attendance.setStatus("PRESENT");
		}

		return attendanceRepository.save(attendance);
	}

	/**
	 * Update today's attendance status for a user (Half Day / Week Off / Holiday /
	 * Present). Creates a today record if none exists yet (no punch-in required).
	 */
	public Attendance updateAttendanceStatus(User currentUser, String status, String location) {

		LocalDate today = LocalDate.now(INDIA_ZONE);

		Attendance record = attendanceRepository.findTopByUserIdAndAttendanceDateOrderByIdDesc(currentUser.getId(),
				today);

		String normalized = status == null ? "" : status.trim().toUpperCase();

		if (normalized.isEmpty()) {
			throw new RuntimeException("Status is required");
		}

		if (!normalized.equals("PRESENT") && !normalized.equals("HALF_DAY") && !normalized.equals("WEEK_OFF")
				&& !normalized.equals("HOLIDAY") && !normalized.equals("COMPLETED")) {

			throw new RuntimeException("Invalid status: " + normalized);
		}

		if (record == null) {

			record = new Attendance();

			record.setUser(currentUser);
			record.setAttendanceDate(today);

		}

		record.setStatus(normalized);

		if (location != null && !location.isBlank()) {
			record.setLocation(location);
		}

		logger.info("Attendance status updated userId={}, status={}", currentUser.getId(), normalized);

		return attendanceRepository.save(record);
	}

	public List<Attendance> getAllAttendance() {

		return attendanceRepository.findAll();
	}

	public List<Attendance> getAttendanceByUser(Long userId) {

		return attendanceRepository.findByUserId(userId);
	}

	public Attendance checkOut(Long attendanceId) {
		return checkOut(attendanceId, null, null, null, null);
	}

	public Attendance checkOut(Long attendanceId, String checkOutSelfiePath) {
		return checkOut(attendanceId, checkOutSelfiePath, null, null, null);
	}

	public Attendance checkOut(Long attendanceId, String checkOutSelfiePath, String location, Double latitude,
			Double longitude) {

		Attendance attendance = attendanceRepository.findById(attendanceId)
				.orElseThrow(() -> new RuntimeException("Attendance Not Found"));

		attendance.setCheckOutTime(LocalTime.now(INDIA_ZONE));

		if (checkOutSelfiePath != null && !checkOutSelfiePath.isBlank()) {
			attendance.setCheckOutSelfiePath(checkOutSelfiePath);
		}

		// Save live GPS location for checkout
		if (location != null && !location.isBlank()) {
			attendance.setLocation(location);
		}
		

		long minutes = Duration.between(attendance.getCheckInTime(), attendance.getCheckOutTime()).toMinutes();

		attendance.setWorkingHours(minutes / 60.0);

// Update attendance status to reflect a completed workday after checkout
		// Update status only for normal working days
		// Do not overwrite HOLIDAY / HALF_DAY / WEEK_OFF

		if (!"HOLIDAY".equals(attendance.getStatus()) && !"HALF_DAY".equals(attendance.getStatus())
				&& !"WEEK_OFF".equals(attendance.getStatus())) {

			attendance.setStatus("COMPLETED");
		}

		logger.info(
				"checkOut: about to save attendance id={}, checkOutSelfiePath={}, checkInTime={}, checkOutTime={}, workingHours={}, lat={}, lng={}, location={}",
				attendance.getId(), attendance.getCheckOutSelfiePath(), attendance.getCheckInTime());
				
		return attendanceRepository.save(attendance);
	}

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production
	 * deployment.
	 */
	public Attendance getAttendanceById(Long id) {
		logger.info("getAttendanceById: requested id={}", id);
		Attendance found = attendanceRepository.findById(id).orElse(null);
		logger.info("getAttendanceById: id={} found={}", id, (found != null));
		return found;
	}

	public List<Attendance> getAttendanceBySiteCode(String siteCode) {
		return attendanceRepository.findByUserSiteCode(siteCode);
	}

	public long getTodayAttendanceCountBySiteCode(String siteCode) {
		return attendanceRepository.countByUserSiteCodeAndAttendanceDate(siteCode, LocalDate.now(INDIA_ZONE));
	}

	/**
	 * Director attendance view (read-only). Returns all attendance records of
	 * EMPLOYEE and SUPERVISOR users, enriched with location/selfie data from the
	 * Report entity when available. Sorted by date descending, then employee name
	 * ascending.
	 */
	public List<AttendanceReportDTO> getDirectorAttendance() {
		List<Attendance> allAttendance = attendanceRepository.findAll();

		return allAttendance.stream().filter(a -> a.getUser() != null).filter(a -> isEmployeeOrSupervisor(a.getUser()))
				.map(a -> {
					Report report = findReportFor(a.getUser().getId(), a.getAttendanceDate());
					return AttendanceReportDTO.fromAttendanceAndReport(a, report, a.getUser());
				})
				.sorted(Comparator
						.comparing(AttendanceReportDTO::getDate, Comparator.nullsLast(Comparator.reverseOrder()))
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
	 * Returns ALL attendance records for all users (no role filtering). Enriched
	 * with employee name, employee ID, role name, location, latitude/longitude, and
	 * selfie data from the Report entity. Sorted by date descending, then employee
	 * name ascending.
	 */
	public List<AttendanceReportDTO> getAllAttendanceWithDetails() {
		List<Attendance> allAttendance = attendanceRepository.findAll();

		return allAttendance.stream().filter(a -> a.getUser() != null).map(a -> {
			Report report = findReportFor(a.getUser().getId(), a.getAttendanceDate());
			return AttendanceReportDTO.fromAttendanceAndReport(a, report, a.getUser());
		}).sorted(Comparator.comparing(AttendanceReportDTO::getDate, Comparator.nullsLast(Comparator.reverseOrder()))
				.thenComparing(AttendanceReportDTO::getEmployeeName, Comparator.nullsLast(Comparator.naturalOrder())))
				.collect(Collectors.toList());
	}

	/**
	 * Permanently delete all attendance records for the given year and month.
	 * Returns the number of deleted records.
	 */
	public int deleteByYearAndMonth(int year, int month) {
		return attendanceRepository.deleteByYearAndMonth(year, month);
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
		return userReports.stream().filter(r -> r.getReportDate() != null && r.getReportDate().equals(date)).findFirst()
				.orElse(userReports.get(userReports.size() - 1));
	}
}



