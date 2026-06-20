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

import com.company.taskmanagement.entity.TaskComments;
import com.company.taskmanagement.service.TaskCommentService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/comments")
public class TaskCommentController {

	@Autowired
	private TaskCommentService taskCommentService;

	@PostMapping
	public TaskComments addComment(@RequestBody TaskComments taskComment) {

		return taskCommentService.addComment(taskComment);
	}

	@GetMapping("/task/{taskId}")
	public List<TaskComments> getCommentsByTask(@PathVariable Long taskId) {

		return taskCommentService.getCommentsByTask(taskId);
	}

}
