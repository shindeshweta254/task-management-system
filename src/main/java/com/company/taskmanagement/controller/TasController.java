package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.TaskService;

import jakarta.validation.Valid;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/tasks")
public class TasController {

	@Autowired
	TaskService taskService;

	@PostMapping
	public Task saveTask(@RequestBody Task task) {
		return taskService.saveTask(task);
	}

	@GetMapping
	public List<Task> getAllTasks() {
		return taskService.getAllTasks();
	}

	@PutMapping("/{taskId}/{status}")
	public Task updateTaskStatus(@PathVariable Long taskId, @PathVariable String status) {

		return taskService.updateTaskStatus(taskId, status);
	}

	@GetMapping("/employee/{userId}")
	public List<Task> getTasksByEmployee(@PathVariable Long userId) {

		return taskService.getTasksByEmployee(userId);

	}

	@GetMapping("/count/total")
	public long totalTasks() {
		return taskService.getTotalTasks();
	}

	@GetMapping("/count/pending")
	public long pendingTasks() {
		return taskService.getPendingTasks();
	}

	@GetMapping("/count/completed")
	public long completedTasks() {
		return taskService.getCompletedTasks();
	}

	@DeleteMapping("/{taskId}")
	public String deleteTask(@PathVariable Long taskId) {

		taskService.deleteTask(taskId);

		return "Task Deleted Successfully";
	}

	@PutMapping("/progress/{taskId}/{progress}")
	public Task updateProgress(@PathVariable Long taskId, @PathVariable Integer progress) {

		return taskService.updateProgress(taskId, progress);
	}
	@GetMapping("/deadline-today")
	public long deadlineToday() {
	    return taskService.getTodayDeadlineTasks();
	}
	
	@GetMapping("/available")
	public List<Task> getAvailableTasks() {

		return taskService.getAvailableTasks();
	}

	@PostMapping("/take/{taskId}/{userId}")
	public Task takeTask(@PathVariable Long taskId, @PathVariable Long userId) {

		return taskService.takeTask(taskId, userId);
	}

	@PutMapping("/approve/{taskId}")
	public Task approveTask(@PathVariable Long taskId) {

		return taskService.updateTaskStatus(taskId, "APPROVED");
	}

	@PutMapping("/changes/{taskId}")
	public Task changesRequested(@PathVariable Long taskId) {

		return taskService.updateTaskStatus(taskId, "CHANGES_REQUESTED");
	}

	@PostMapping("/{taskId}/watchers/{userId}")
	public Task addWatcher(@PathVariable Long taskId, @PathVariable Long userId) {

		return taskService.addWatcher(taskId, userId);
	}

	@GetMapping("/{taskId}/watchers")
	public List<User> getWatchers(@PathVariable Long taskId) {

		return taskService.getWatchers(taskId);
	}
	
	@GetMapping("/dashboard/{userId}/total")
	public long employeeTotal(@PathVariable Long userId){

	    return taskService.getEmployeeTotalTasks(userId);

	}

	@GetMapping("/dashboard/{userId}/pending")
	public long employeePending(@PathVariable Long userId){

	    return taskService.getEmployeePendingTasks(userId);

	}

	@GetMapping("/dashboard/{userId}/completed")
	public long employeeCompleted(@PathVariable Long userId){

	    return taskService.getEmployeeCompletedTasks(userId);

	}

	@GetMapping("/dashboard/{userId}/deadline")
	public long employeeDeadline(@PathVariable Long userId){

	    return taskService.getEmployeeDeadlineTasks(userId);

	}
}
