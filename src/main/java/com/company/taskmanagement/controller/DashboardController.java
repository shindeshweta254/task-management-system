package com.company.taskmanagement.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.DashboardService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	@Autowired
	private DashboardService dashboardService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private UserRepository userRepository;

	@GetMapping("/total-tasks")
	public long totalTasks(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getTotalTasks();
	}

	@GetMapping("/pending-tasks")
	public long pendingTasks(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getPendingTasks();
	}

	@GetMapping("/completed-tasks")
	public long completedTasks(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getCompletedTasks();
	}

	@GetMapping("/positive-reviews")
	public long positiveReviews(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getPositiveReviews();
	}

	@GetMapping("/negative-reviews")
	public long negativeReviews(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getNegativeReviews();
	}

	@GetMapping("/summary")
	public Map<String, Object> getSummary(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getDashboardSummary();
	}

	@GetMapping("/monthly-score/{userId}")
	public int monthlyScore(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return dashboardService.getMonthlyScore(userId);
	}

	@GetMapping("/total-employees")
	public long totalEmployees(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		// For elevated/SP002 users, return all employees count
		if (accessService.hasElevatedAccess(currentUser) || accessService.isSP002(currentUser)) {
			return dashboardService.getTotalEmployees();
		}
		// For others, return count of users in their site
		return 0; // Simplified: count from filtered list
	}

	@GetMapping("/delayed-tasks")
	public long delayedTasks(HttpServletRequest request) {
		accessService.resolveUser(request);
		return dashboardService.getDelayedTasks();
	}
	
	@GetMapping("/team-performance")
	public int teamPerformance(HttpServletRequest request) {
		accessService.resolveUser(request);
	    return dashboardService.getTeamPerformance();
	}

	@GetMapping("/my-dashboard")
	public Map<String, Object> getMyDashboard(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		Map<String, Object> dashboard = new java.util.HashMap<>();

		// Employee-level stats (own data)
		dashboard.put("myTotalTasks", taskRepository.countByAssignedToId(currentUser.getId()));
		dashboard.put("myPendingTasks", taskRepository.countByAssignedToIdAndStatus(currentUser.getId(), "PENDING"));
		dashboard.put("myCompletedTasks", taskRepository.countByAssignedToIdAndStatus(currentUser.getId(), "COMPLETED"));
		dashboard.put("myDelayedTasks", taskRepository
				.findByAssignedToId(currentUser.getId())
				.stream()
				.filter(t -> t.getDueDate() != null
						&& t.getDueDate().isBefore(java.time.LocalDate.now())
						&& !"COMPLETED".equals(t.getStatus()))
				.count());

		// For supervisors/managers/SP001/SP002, include site-level stats
		if (accessService.isSupervisor(currentUser) || accessService.isManager(currentUser)
				|| accessService.isSP001(currentUser) || accessService.isSP002(currentUser)
				|| accessService.hasElevatedAccess(currentUser)) {

			dashboard.put("mySiteTotalTasks", taskRepository.countByAssignedToSiteCode(currentUser.getSiteCode()));
			dashboard.put("mySitePendingTasks", taskRepository.countByAssignedToSiteCodeAndStatus(currentUser.getSiteCode(), "PENDING"));
			dashboard.put("mySiteCompletedTasks", taskRepository.countByAssignedToSiteCodeAndStatus(currentUser.getSiteCode(), "COMPLETED"));
			dashboard.put("mySiteEmployees", userRepository.countBySiteCode(currentUser.getSiteCode()));
		}

		return dashboard;
	}
}
