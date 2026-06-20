package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.service.ReportService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/reports")
public class ReportController {
	@Autowired
	private ReportService dailyReportService;

	@PostMapping
	public Report saveReport(@RequestBody Report report) {

		return dailyReportService.saveReport(report);
	}

	@GetMapping
	public List<Report> getAllReports() {

		return dailyReportService.getAllReports();
	}

	@GetMapping("/user/{userId}")
	public List<Report> getReportsByUser(@PathVariable Long userId) {

		return dailyReportService.getReportsByUser(userId);
	}
}
