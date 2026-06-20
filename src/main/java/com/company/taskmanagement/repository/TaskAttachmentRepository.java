package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.TaskAttachment;

public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {
	List<TaskAttachment> findByTaskId(Long taskId);

	TaskAttachment findFirstByTaskId(Long taskId);
}
