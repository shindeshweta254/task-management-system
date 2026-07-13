package com.company.taskmanagement.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.repository.AttendanceRepository;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/dashboard")
public class AttendanceDashboardController {

	@Autowired
	private AttendanceRepository attendanceRepository;

	@GetMapping("/todays-attendance")
	public long todaysAttendance() {
		// AttendanceService/Repo in current code stores Attendance with attendanceDate.
		// If dataset is empty, return 0.
		return attendanceRepository.countByAttendanceDate(LocalDate.now());
	}
}

