package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.WorkHistoryDTO;
import com.company.taskmanagement.service.WorkHistoryService;
@CrossOrigin(origins = "http://localhost:5173")
// Disabled: Work History module removed as requested.
// @RestController
// @RequestMapping("/api/work-history")
public class WorkHistoryController {

	@Autowired
	private WorkHistoryService workHistoryService;

	@GetMapping("/user/{userId}")
	public List<WorkHistoryDTO> getHistory(@PathVariable Long userId) {

		return workHistoryService.getWorkHistory(userId);
	}
}
