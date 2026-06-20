package com.company.taskmanagement.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Activitylog;

public interface ActivityLogRepository extends JpaRepository<Activitylog, Long> {
	List<Activitylog> findByTaskId(Long taskId);

	List<Activitylog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
