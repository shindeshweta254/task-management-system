package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.taskmanagement.entity.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
	List<Attendance> findByUserId(Long userId);

	long countByAttendanceDate(LocalDate attendanceDate);

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
	@Query("SELECT a FROM Attendance a WHERE a.user.siteCode = :siteCode")
	List<Attendance> findByUserSiteCode(@Param("siteCode") String siteCode);

	@Query("SELECT COUNT(a) FROM Attendance a WHERE a.user.siteCode = :siteCode AND a.attendanceDate = :date")
	long countByUserSiteCodeAndAttendanceDate(@Param("siteCode") String siteCode, @Param("date") LocalDate date);
}
