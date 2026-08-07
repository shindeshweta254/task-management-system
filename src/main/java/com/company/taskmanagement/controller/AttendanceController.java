package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

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
	private static final Logger logger = LoggerFactory.getLogger(AttendanceController.class);

	@Autowired
	private AttendanceService attendanceService;

	@Autowired
	private AccessService accessService;

@PostMapping("/checkin")
	public Attendance checkIn(
			@RequestParam(value = "location", required = false) String location,
			@RequestParam(value = "latitude", required = false) Double latitude,
			@RequestParam(value = "longitude", required = false) Double longitude,
			@RequestParam(value = "selfie", required = false) MultipartFile selfie,
			HttpServletRequest request) throws Exception {

		User currentUser = accessService.resolveUser(request);

		Attendance attendance = new Attendance();
		attendance.setUser(currentUser);
		attendance.setLocation(location);
		
		logger.info("checkin: live GPS location={}, latitude={}, longitude={}", location, latitude, longitude);

// Save punch-in selfie file if provided
		if (selfie != null && !selfie.isEmpty()) {
			String savedPath = saveSelfieFile(selfie, "checkin");
			attendance.setCheckInSelfiePath(savedPath);
			logger.info("checkin: saved checkInSelfiePath={}", savedPath);
		} else {
			logger.warn("checkin: selfie part missing or empty - checkInSelfiePath will be NULL");
		}

		return attendanceService.checkIn(attendance);
	}

	/**
	 * Save an attendance selfie image file under uploads/attendance/.
	 * Returns the relative file path (e.g. uploads/attendance/1234_selfie.jpg).
	 */
	private String saveSelfieFile(MultipartFile selfie, String prefix) throws Exception {
		String uploadsDir = "uploads/attendance";
		Path uploadPath = Paths.get(uploadsDir);
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		String originalName = selfie.getOriginalFilename();
		String ext = "";
		if (originalName != null && originalName.contains(".")) {
			ext = originalName.substring(originalName.lastIndexOf("."));
		}
		if (ext.isEmpty()) {
			ext = ".jpg";
		}

		String fileName = System.currentTimeMillis() + "_" + prefix + "_" + selfie.hashCode() + ext;
		Path filePath = uploadPath.resolve(fileName);
		Files.copy(selfie.getInputStream(), filePath);

		return uploadPath.resolve(fileName).toString();
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
			@PathVariable("userId") Long userId,
			HttpServletRequest request) {

User currentUser = accessService.resolveUser(request);

		// Self-access: an employee can always view their own attendance.
		// Compare the logged-in user id (from X-User-Id) with the requested userId.
		if (currentUser.getId().equals(userId)) {
			return attendanceService.getAttendanceByUser(userId);
		}

		// Non-self access: enforce site/role-based rules (supervisor, manager,
		// director, SP001/SP002, admin, etc.) unchanged.
		accessService.resolveAndValidateTargetUser(request, userId);
		return attendanceService.getAttendanceByUser(userId);
	}
	
@PutMapping("/checkout/{attendanceId}")
	public Attendance checkOut(
	        @PathVariable("attendanceId") Long attendanceId,
	        @RequestParam(value = "location", required = false) String location,
	        @RequestParam(value = "latitude", required = false) Double latitude,
	        @RequestParam(value = "longitude", required = false) Double longitude,
	        @RequestParam(value = "selfie", required = false) MultipartFile selfie,
	        HttpServletRequest request) throws Exception {

		User currentUser = accessService.resolveUser(request);
		logger.info("checkout: received attendanceId={}, currentUserId={}", attendanceId, currentUser.getId());
		Attendance attendance = attendanceService.getAttendanceById(attendanceId);
		if (attendance == null) {
			logger.warn("checkout: attendance record with id={} NOT FOUND", attendanceId);
			throw new RuntimeException("Attendance Not Found with id=" + attendanceId);
		}
		if (!attendance.getUser().getId().equals(currentUser.getId())) {
			logger.warn("checkout: unauthorized - attendance id={} belongs to userId={}, but currentUserId={}",
					attendanceId, attendance.getUser().getId(), currentUser.getId());
			throw new RuntimeException("Unauthorized: You can only checkout your own attendance");
		}

		// Save punch-out selfie file if provided
		String checkOutSelfiePath = null;
		if (selfie != null && !selfie.isEmpty()) {
			checkOutSelfiePath = saveSelfieFile(selfie, "checkout");
			logger.info("checkout: saved checkOutSelfiePath={}", checkOutSelfiePath);
		} else {
			logger.warn("checkout: selfie part missing or empty - checkOutSelfiePath will be NULL");
		}

		// Live GPS location for checkout
		logger.info("checkout: live GPS location={}, latitude={}, longitude={}", location, latitude, longitude);

	    return attendanceService.checkOut(attendanceId, checkOutSelfiePath, location, latitude, longitude);
	}

@GetMapping("/me")
	public List<Attendance> getMyAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		return attendanceService.getAttendanceByUser(currentUser.getId());
	}

/**
	 * PUT /api/attendance/status
	 *
	 * Update today's attendance status (Half Day / Week Off / Holiday / Present).
	 * Accepts JSON body: { "status": "...", "location": "..." }
	 * Uses X-User-Id authentication.
	 */
@PutMapping("/status")
	public Attendance updateStatus(
			@RequestBody java.util.Map<String, String> body,
			HttpServletRequest request) {

		System.out.println("STATUS API HEADER = "
				+ request.getHeader("X-User-Id"));

		User currentUser = accessService.resolveUser(request);

		System.out.println("STATUS API USER = "
				+ currentUser.getId());

		String status = body != null ? body.get("status") : null;
		String location = body != null ? body.get("location") : null;

		return attendanceService.updateAttendanceStatus(currentUser, status, location);
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

	/**
	 * DELETE /api/attendance/delete-by-month?year=2025&month=3
	 *
	 * Permanently deletes all attendance records for the given month.
	 * Director/Admin only.
	 */
	@DeleteMapping("/delete-by-month")
	public ResponseEntity<String> deleteByMonth(
	        @RequestParam("year") int year,
	        @RequestParam("month") int month,
	        HttpServletRequest request) {

	    User currentUser = accessService.resolveUser(request);
	    accessService.validateDirectorDashboardAccess(currentUser);

	    if (month < 1 || month > 12) {
	        return ResponseEntity.badRequest().body("Invalid month: must be between 1 and 12");
	    }

	    int deleted = attendanceService.deleteByYearAndMonth(year, month);
	    return ResponseEntity.ok("Deleted " + deleted + " attendance records for " + year + "-" + month);
	}
	
	}
