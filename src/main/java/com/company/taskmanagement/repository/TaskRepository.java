package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByAssignedToId(Long userId);

	long countByStatus(String status);

	long countByAssignedToId(Long userId);

	long countByAssignedToIdAndStatus(Long userId, String status);

	long countByDueDate(LocalDate dueDate);

	long countByDueDateBeforeAndStatusNot(LocalDate date, String status);
	
	List<Task> findByAssignedToIsNull();

	List<Task> findByAssignedToIdAndStatus(Long userId, String string);
	
}
