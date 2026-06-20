package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.repository.ReportRepository;

@Service
public class ReportService {

	@Autowired
	private ReportRepository ReportRepository;

	public Report saveReport(Report report) {

		return ReportRepository.save(report);
	}

	public List<Report> getAllReports() {

		return ReportRepository.findAll();
	}

	public List<Report> getReportsByUser(Long userId) {

		return ReportRepository.findByUserId(userId);
	}

}
