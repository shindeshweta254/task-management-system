package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.AttendanceReportDTO;
import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.AttendanceService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
	@Autowired
	private AttendanceService attendanceService;

	@Autowired
	private AccessService accessService;

	@PostMapping("/checkin")
	public Attendance checkIn(@RequestBody Attendance attendance, HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		attendance.setUser(currentUser);
		return attendanceService.checkIn(attendance);
	}

	@GetMapping
	public List<Attendance> getAllAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Attendance> allAttendance = attendanceService.getAllAttendance();
		return allAttendance.stream()
				.filter(a -> {
					if (a.getUser() == null) return false;
					// Build a minimal user object for site check
					User targetUser = a.getUser();
					try {
						accessService.validateTargetEmployee(currentUser, targetUser);
						return true;
					} catch (Exception e) {
						return false;
					}
				})
				.collect(Collectors.toList());
	}

	@GetMapping("/user/{userId}")
	public List<Attendance> getAttendanceByUser(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return attendanceService.getAttendanceByUser(userId);
	}
	
	@PutMapping("/checkout/{attendanceId}")
	public Attendance checkOut(
	        @PathVariable Long attendanceId,
	        HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Attendance attendance = attendanceService.getAttendanceById(attendanceId);
		if (attendance == null || !attendance.getUser().getId().equals(currentUser.getId())) {
			throw new RuntimeException("Unauthorized: You can only checkout your own attendance");
		}
	    return attendanceService.checkOut(attendanceId);
	}

	@GetMapping("/me")
	public List<Attendance> getMyAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		return attendanceService.getAttendanceByUser(currentUser.getId());
	}

	@GetMapping("/my-site")
	public List<Attendance> getMySiteAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		// For supervisors/managers/SP001/SP002 - return site attendance
		if (accessService.isSupervisor(currentUser) || accessService.isManager(currentUser)
				|| accessService.isSP001(currentUser) || accessService.isSP002(currentUser)
				|| accessService.hasElevatedAccess(currentUser)) {
			return attendanceService.getAttendanceBySiteCode(currentUser.getSiteCode());
		}
		// For employees, return own attendance
		return attendanceService.getAttendanceByUser(currentUser.getId());
	}

/**
	 * GET /api/attendance/director
	 *
	 * Director-only read-only endpoint. Returns attendance of all EMPLOYEE and
	 * SUPERVISOR users with location (address/coordinates) and selfie data
	 * from the Report entity when available.
	 */
	@GetMapping("/director")
	public List<AttendanceReportDTO> getDirectorAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		accessService.validateDirectorDashboardAccess(currentUser);
		return attendanceService.getDirectorAttendance();
	}

	/**
	 * GET /api/attendance/all
	 *
	 * Returns ALL attendance records for all users (no role filtering).
	 * Includes employee name, employee ID, date, check-in/out, status,
	 * location, latitude/longitude, and selfie data.
	 * Director/Admin only.
	 */
	@GetMapping("/all")
	public List<AttendanceReportDTO> getAllAttendanceForDirector(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		accessService.validateDirectorDashboardAccess(currentUser);
		return attendanceService.getAllAttendanceWithDetails();
	}
}
