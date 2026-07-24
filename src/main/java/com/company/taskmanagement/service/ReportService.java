package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.repository.ReportRepository;

@Service
public class ReportService {

	@Autowired
	private ReportRepository reportRepository;

	public Report saveReport(Report report) {
		return reportRepository.save(report);
	}

	public List<Report> getAllReports() {
		return reportRepository.findAll();
	}

	public List<Report> getReportsByUser(Long userId) {
		return reportRepository.findByUserId(userId);
	}

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
	public List<Report> getReportsBySiteCode(String siteCode) {
		return reportRepository.findByUserSiteCode(siteCode);
	}
}
