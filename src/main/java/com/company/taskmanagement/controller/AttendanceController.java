package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.service.AttendanceService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
	@Autowired
	private AttendanceService attendanceService;

	@PostMapping("/checkin")
	public Attendance checkIn(@RequestBody Attendance attendance) {

		return attendanceService.checkIn(attendance);
	}

	@GetMapping
	public List<Attendance> getAllAttendance() {

		return attendanceService.getAllAttendance();
	}

	@GetMapping("/user/{userId}")
	public List<Attendance> getAttendanceByUser(@PathVariable Long userId) {

		return attendanceService.getAttendanceByUser(userId);
	}
	
	@PutMapping("/checkout/{attendanceId}")
	public Attendance checkOut(
	        @PathVariable Long attendanceId) {

	    return attendanceService.checkOut(attendanceId);
	}
}
