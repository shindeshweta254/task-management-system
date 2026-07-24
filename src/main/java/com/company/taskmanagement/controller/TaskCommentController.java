package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.TaskComments;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.TaskCommentService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/comments")
public class TaskCommentController {

	@Autowired
	private TaskCommentService taskCommentService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private TaskRepository taskRepository;

	@PostMapping
	public TaskComments addComment(@RequestBody TaskComments taskComment, HttpServletRequest request) {
		accessService.resolveUser(request);
		if (taskComment.getTask() != null && taskComment.getTask().getId() != null) {
			User currentUser = accessService.resolveUser(request);
			Task task = taskRepository.findById(taskComment.getTask().getId())
					.orElseThrow(() -> new RuntimeException("Task Not Found"));
			accessService.validateTaskAccess(currentUser, task);
		}
		return taskCommentService.addComment(taskComment);
	}

	@GetMapping("/task/{taskId}")
	public List<TaskComments> getCommentsByTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task Not Found"));
		accessService.validateTaskAccess(currentUser, task);
		return taskCommentService.getCommentsByTask(taskId);
	}

}
