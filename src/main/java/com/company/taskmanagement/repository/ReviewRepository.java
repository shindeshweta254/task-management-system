package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.company.taskmanagement.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
	Review findByTaskId(Long taskId);

	long countByPositiveScoreGreaterThan(int score);

	long countByNegativeScoreGreaterThan(int score);

	List<Review> findAll();

	@Query("SELECT COALESCE(SUM(r.positiveScore),0) FROM Review r")
	Integer getTotalPositiveScore();

	@Query("SELECT COALESCE(SUM(r.negativeScore),0) FROM Review r")
	Integer getTotalNegativeScore();

}
