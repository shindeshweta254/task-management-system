package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {
	List<Report> findByUserId(Long userId);
}
