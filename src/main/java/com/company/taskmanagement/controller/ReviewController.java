package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Review;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ReviewService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
	@Autowired
	private ReviewService reviewService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private TaskRepository taskRepository;

	@PostMapping
	public Review saveReview(@RequestBody Review review, HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		if (review.getTask() != null && review.getTask().getId() != null) {
			Task task = taskRepository.findById(review.getTask().getId())
					.orElseThrow(() -> new RuntimeException("Task Not Found"));
			accessService.validateTaskAccess(currentUser, task);
		}
		return reviewService.saveReview(review);
	}

	@GetMapping("/task/{taskId}")
	public Review getReviewsByTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task Not Found"));
		accessService.validateTaskAccess(currentUser, task);
		return reviewService.getReviewsByTask(taskId);
	}
}
