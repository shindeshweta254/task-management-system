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

import com.company.taskmanagement.entity.ChangeRequest;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ChangeRequestService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/change-requests")
public class ChangeRequestController {
	@Autowired
	ChangeRequestService changeRequestService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private TaskRepository taskRepository;

	@PostMapping
	public ChangeRequest saveChangeRequest(@RequestBody ChangeRequest changeRequest, HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		if (changeRequest.getTask() != null && changeRequest.getTask().getId() != null) {
			Task task = taskRepository.findById(changeRequest.getTask().getId())
					.orElseThrow(() -> new RuntimeException("Task Not Found"));
			accessService.validateTaskAccess(currentUser, task);
		}
		return changeRequestService.saveChangeRequest(changeRequest);
	}

	@GetMapping("/task/{taskId}")
	public List<ChangeRequest> getByTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task Not Found"));
		accessService.validateTaskAccess(currentUser, task);
		return changeRequestService.getByTask(taskId);
	}

}
