package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.DirectorDashboardDTO;
import com.company.taskmanagement.dto.DirectorDashboardService;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
public class DirectorDashboardController {
	@Autowired
	private DirectorDashboardService directorDashboardService;

	@Autowired
	private AccessService accessService;

	@GetMapping("/api/director/dashboard")
	public DirectorDashboardDTO getDashboard(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		accessService.validateDirectorDashboardAccess(currentUser);
		return directorDashboardService.getDashboard();
	}
}
