package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.DirectorDashboardDTO;
import com.company.taskmanagement.dto.DirectorDashboardService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class DirectorDashboardController {
	@Autowired
	private DirectorDashboardService directorDashboardService;

	@GetMapping("/api/director/dashboard")
	public DirectorDashboardDTO getDashboard() {

		return directorDashboardService.getDashboard();
	}
}
