package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Review;
import com.company.taskmanagement.service.ReviewService;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
	@Autowired
	private ReviewService reviewService;

	@PostMapping
	public Review saveReview(@RequestBody Review review) {

		return reviewService.saveReview(review);
	}

	@GetMapping("/task/{taskId}")
	public List<Review> getReviewsByTask(@PathVariable Long taskId) {

		return (List<Review>) reviewService.getReviewsByTask(taskId);
	}
}
