package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.TaskComments;

public interface TaskCommentRepository extends JpaRepository<TaskComments, Long> {
	 List<TaskComments> findByTaskId(Long taskId);
}
