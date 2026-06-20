package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Activitylog;
import com.company.taskmanagement.entity.Review;
import com.company.taskmanagement.repository.ReviewRepository;

@Service
public class ReviewService {

	@Autowired
	private ReviewRepository reviewRepository;

	@Autowired
	private ActivityLogService activityLogService;

	public Review saveReview(Review review) {

		Review savedReview = reviewRepository.save(review);

		Activitylog log = new Activitylog();

		log.setAction("Review Submitted");

		log.setUsername(review.getReviewedBy().getName());

		log.setTask(review.getTask());

		activityLogService.saveLog(log);

		return savedReview;
	}

	public Review getReviewsByTask(Long taskId) {

		return reviewRepository.findByTaskId(taskId);
	}

	public int getTeamPerformanceScore() {

		List<Review> reviews = reviewRepository.findAll();

		int totalPositive = 0;
		int totalNegative = 0;

		for (Review review : reviews) {

			if (review.getPositiveScore() != null) {
				totalPositive += review.getPositiveScore();
			}

			if (review.getNegativeScore() != null) {
				totalNegative += review.getNegativeScore();
			}
		}

		return totalPositive - totalNegative;
	}
}
