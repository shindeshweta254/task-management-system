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
import com.company.taskmanagement.service.ChangeRequestService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/change-requests")
public class ChangeRequestController {
	@Autowired
	ChangeRequestService changeRequestService;

	@PostMapping
	public ChangeRequest saveChangeRequest(@RequestBody ChangeRequest changeRequest) {

		return changeRequestService.saveChangeRequest(changeRequest);
	}

	@GetMapping("/task/{taskId}")
	public List<ChangeRequest> getByTask(@PathVariable Long taskId) {

		return changeRequestService.getByTask(taskId);
	}

}
