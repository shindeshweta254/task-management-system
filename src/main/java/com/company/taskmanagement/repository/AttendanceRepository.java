package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Attendance;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
	  List<Attendance> findByUserId(Long userId);
}
