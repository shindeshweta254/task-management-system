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
import org.springframework.web.bind.annotation.RequestParam;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.service.ReportService;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/reports")
public class ReportController {
	@Autowired
	private ReportService dailyReportService;

	// Existing JSON save
	@PostMapping
	public Report saveReport(@RequestBody Report report) {
		return dailyReportService.saveReport(report);
	}

	// Upload proof + live location
	@PostMapping("/upload")
	public Report uploadDailyWorkProof(
			@RequestParam("userId") Long userId,
			@RequestParam("completedWork") String completedWork,
			@RequestParam("pendingWork") String pendingWork,
			@RequestParam("issues") String issues,
			@RequestParam("reportDate") String reportDate,
			@RequestParam("latitude") Double latitude,
			@RequestParam("longitude") Double longitude,
			@RequestParam(value = "locationAddress", required = false) String locationAddress,
			@RequestParam("proof") org.springframework.web.multipart.MultipartFile proof
	) throws Exception {

		Report report = new Report();
		report.setCompletedWork(completedWork);
		report.setPendingWork(pendingWork);
		report.setIssues(issues);

		report.setReportDate(java.time.LocalDate.parse(reportDate, DateTimeFormatter.ISO_LOCAL_DATE));
		report.setLatitude(latitude);
		report.setLongitude(longitude);
		report.setLocationAddress(locationAddress);

		// Save file on server (simple local filesystem storage)
		String uploadsDir = "uploads/reports";
		Path uploadPath = Paths.get(uploadsDir);
		if (!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}

		String originalName = proof.getOriginalFilename() == null ? "proof" : proof.getOriginalFilename();
		String safeName = System.currentTimeMillis() + "_" + originalName.replaceAll("\\s+", "_");
		Path filePath = uploadPath.resolve(safeName);
		Files.copy(proof.getInputStream(), filePath);

		report.setProofFileName(safeName);
		report.setProofFilePath(filePath.toString());

		// Attach user by setting only the id (JPA will manage proxy)
		com.company.taskmanagement.entity.User u = new com.company.taskmanagement.entity.User();
		u.setId(userId);
		report.setUser(u);

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

