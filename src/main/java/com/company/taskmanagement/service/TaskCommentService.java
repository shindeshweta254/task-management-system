package com.company.taskmanagement.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.TaskComments;
import com.company.taskmanagement.repository.TaskCommentRepository;

@Service
public class TaskCommentService {

	@Autowired
	private TaskCommentRepository taskCommentRepository;

	public TaskComments addComment(TaskComments taskComment) {

		taskComment.setCreatedAt(LocalDateTime.now());

		return taskCommentRepository.save(taskComment);
	}

	public java.util.List<TaskComments> getCommentsByTask(Long taskId) {

		return taskCommentRepository.findByTaskId(taskId);
	}

}
