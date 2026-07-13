package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Activitylog;
import com.company.taskmanagement.service.ActivityLogService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/logs")
public class ActivityLogController {

	@Autowired
	ActivityLogService activityLogService;

	@GetMapping("/api/activity")
	public List<Activitylog> getAllLogs() {

		return activityLogService.getAllLogs();
	}

	@GetMapping("/today")
	public List<Activitylog> getTodayLogs() {
		return activityLogService.getTodayLogs();
	}
}
