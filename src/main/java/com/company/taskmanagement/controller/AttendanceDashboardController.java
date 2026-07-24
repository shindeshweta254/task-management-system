package com.company.taskmanagement.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.AttendanceRepository;
import com.company.taskmanagement.service.AccessService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/dashboard")
public class AttendanceDashboardController {

	@Autowired
	private AttendanceRepository attendanceRepository;

	@Autowired
	private AccessService accessService;

	@GetMapping("/todays-attendance")
	public long todaysAttendance(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		// For elevated users, return total today's count
		if (accessService.hasElevatedAccess(currentUser) || accessService.isSP002(currentUser)) {
			return attendanceRepository.countByAttendanceDate(LocalDate.now());
		}
		// For others, return count only for their site
		return attendanceRepository.countByUserSiteCodeAndAttendanceDate(
				currentUser.getSiteCode(), LocalDate.now());
	}
}

