package com.company.taskmanagement.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.repository.AttendanceRepository;

@Service
public class AttendanceService {

	@Autowired
	private AttendanceRepository attendanceRepository;

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
	public List<Attendance> getAttendanceBySiteCode(String siteCode) {
		return attendanceRepository.findByUserSiteCode(siteCode);
	}

	public long getTodayAttendanceCountBySiteCode(String siteCode) {
		return attendanceRepository.countByUserSiteCodeAndAttendanceDate(siteCode, LocalDate.now());
	}
}
