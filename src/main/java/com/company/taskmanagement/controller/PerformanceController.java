package com.company.taskmanagement.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.PerformanceService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/performance")
public class PerformanceController {

	@Autowired
	private PerformanceService performanceService;

	@Autowired
	private AccessService accessService;

	@GetMapping("/employee/{userId}")
	public Map<String, Object> getEmployeePerformance(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return performanceService.getEmployeePerformance(userId);
	}
}
