package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.taskmanagement.entity.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {
	List<Report> findByUserId(Long userId);

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
	@Query("SELECT r FROM Report r WHERE r.user.siteCode = :siteCode")
	List<Report> findByUserSiteCode(@Param("siteCode") String siteCode);
}
