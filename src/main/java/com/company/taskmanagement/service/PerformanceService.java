package com.company.taskmanagement.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.repository.TaskRepository;

@Service
public class PerformanceService {
	@Autowired
	private TaskRepository taskRepository;

	public Map<String, Object> getEmployeePerformance(Long userId) {

		Map<String, Object> result = new HashMap<>();

		long totalTasks = taskRepository.countByAssignedToId(userId);
		long completedTasks = taskRepository.countByAssignedToIdAndStatus(userId, "COMPLETED");
		long pendingTasks = taskRepository.countByAssignedToIdAndStatus(userId, "PENDING");

		result.put("employeeId", userId);
		result.put("totalTasks", totalTasks);
		result.put("completedTasks", completedTasks);
		result.put("pendingTasks", pendingTasks);

		return result;
	}
}
