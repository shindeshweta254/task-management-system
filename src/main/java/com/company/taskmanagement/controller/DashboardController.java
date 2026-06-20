package com.company.taskmanagement.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.service.DashboardService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	@Autowired
	private DashboardService dashboardService;

	@GetMapping("/total-tasks")
	public long totalTasks() {
		return dashboardService.getTotalTasks();
	}

	@GetMapping("/pending-tasks")
	public long pendingTasks() {
		return dashboardService.getPendingTasks();
	}

	@GetMapping("/completed-tasks")
	public long completedTasks() {
		return dashboardService.getCompletedTasks();
	}

	@GetMapping("/positive-reviews")
	public long positiveReviews() {
		return dashboardService.getPositiveReviews();
	}

	@GetMapping("/negative-reviews")
	public long negativeReviews() {
		return dashboardService.getNegativeReviews();
	}

	@GetMapping("/summary")
	public Map<String, Object> getSummary() {

		return dashboardService.getDashboardSummary();
	}

	@GetMapping("/monthly-score/{userId}")
	public int monthlyScore(@PathVariable Long userId) {

		return dashboardService.getMonthlyScore(userId);
	}

	@GetMapping("/total-employees")
	public long totalEmployees() {

		return dashboardService.getTotalEmployees();
	}

	@GetMapping("/delayed-tasks")
	public long delayedTasks() {
		return dashboardService.getDelayedTasks();
	}
	
	@GetMapping("/team-performance")
	public int teamPerformance() {
	    return dashboardService.getTeamPerformance();
	}
}
