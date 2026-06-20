package com.company.taskmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Review;
import com.company.taskmanagement.repository.ReviewRepository;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private ReviewRepository reviewRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ReviewService reviewService;

	public long getTotalTasks() {
		return taskRepository.count();
	}

	public long getPendingTasks() {
		return taskRepository.countByStatus("PENDING");
	}

	public long getCompletedTasks() {
		return taskRepository.countByStatus("COMPLETED");
	}

	public long getPositiveReviews() {
		return reviewRepository.countByPositiveScoreGreaterThan(0);
	}

	public long getNegativeReviews() {
		return reviewRepository.countByNegativeScoreGreaterThan(0);
	}

	public long getTotalEmployees() {

		return userRepository.countByRoleRoleName("EMPLOYEE");
	}

	public long getDelayedTasks() {
		return taskRepository.countByDueDateBeforeAndStatusNot(LocalDate.now(), "COMPLETED");
	}

	public int getTeamPerformance() {
		return reviewService.getTeamPerformanceScore();
	}

	public Map<String, Object> getDashboardSummary() {

		Map<String, Object> summary = new HashMap<>();

		summary.put("totalTasks", taskRepository.count());
		summary.put("pendingTasks", taskRepository.countByStatus("PENDING"));
		summary.put("completedTasks", taskRepository.countByStatus("COMPLETED"));
		summary.put("positiveReviews", reviewRepository.countByPositiveScoreGreaterThan(0));
		summary.put("negativeReviews", reviewRepository.countByNegativeScoreGreaterThan(0));
		summary.put("rating", getRating());
		summary.put("delayedTasks", getDelayedTasks());
		return summary;
	}

	public int getMonthlyScore(Long userId) {

		List<Review> reviews = reviewRepository.findAll();

		int score = 0;

		for (Review review : reviews) {

			if (review.getTask() != null && review.getTask().getAssignedTo() != null
					&& review.getTask().getAssignedTo().getId().equals(userId)) {

				score += review.getPositiveScore() != null ? review.getPositiveScore() : 0;

				score -= review.getNegativeScore() != null ? review.getNegativeScore() : 0;
			}
		}

		return score;
	}

	public Double getRating() {

		Integer positive = reviewRepository.getTotalPositiveScore();
		Integer negative = reviewRepository.getTotalNegativeScore();

		if ((positive + negative) == 0) {
			return 0.0;
		}

		return (positive * 5.0) / (positive + negative);
	}

	
}
