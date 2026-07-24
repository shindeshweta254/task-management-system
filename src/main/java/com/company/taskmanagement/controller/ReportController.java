package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

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
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ReportService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/reports")
public class ReportController {
	@Autowired
	private ReportService dailyReportService;

	@Autowired
	private AccessService accessService;

	// Existing JSON save
	@PostMapping
	public Report saveReport(@RequestBody Report report, HttpServletRequest request) {
		accessService.resolveUser(request);
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
			@RequestParam("proof") org.springframework.web.multipart.MultipartFile proof,
			HttpServletRequest request
	) throws Exception {

		accessService.resolveAndValidateTargetUser(request, userId);

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
	public List<Report> getAllReports(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Report> allReports = dailyReportService.getAllReports();
		return allReports.stream()
				.filter(r -> {
					if (r.getUser() == null) return false;
					try {
						accessService.validateTargetEmployee(currentUser, r.getUser());
						return true;
					} catch (Exception e) {
						return false;
					}
				})
				.collect(Collectors.toList());
	}

	@GetMapping("/user/{userId}")
	public List<Report> getReportsByUser(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return dailyReportService.getReportsByUser(userId);
	}

	@GetMapping("/me")
	public List<Report> getMyReports(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		return dailyReportService.getReportsByUser(currentUser.getId());
	}

	@GetMapping("/my-site")
	public List<Report> getMySiteReports(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		// For supervisors/managers/SP001/SP002 - return site reports
		if (accessService.isSupervisor(currentUser) || accessService.isManager(currentUser)
				|| accessService.isSP001(currentUser) || accessService.isSP002(currentUser)
				|| accessService.hasElevatedAccess(currentUser)) {
			return dailyReportService.getReportsBySiteCode(currentUser.getSiteCode());
		}
		// For employees, return own reports
		return dailyReportService.getReportsByUser(currentUser.getId());
	}
}

