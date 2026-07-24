package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

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

import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.TaskService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/tasks")
public class TasController {

	@Autowired
	TaskService taskService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private TaskRepository taskRepository;

	@PostMapping
	public Task saveTask(@RequestBody Task task, HttpServletRequest request) {
		accessService.resolveUser(request);
		return taskService.saveTask(task);
	}

	@PutMapping("/{taskId}/{status}")
	public Task updateTaskStatus(
			@PathVariable Long taskId,
			@PathVariable String status,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.updateTaskStatus(taskId, status);
	}

	@GetMapping("/employee/{userId}")
	public List<Task> getTasksByEmployee(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return taskService.getTasksByEmployee(userId);
	}

	// Owner/Admin (and other privileged roles) के लिए सभी tasks
	@GetMapping("/all")
	public List<Task> getAllTasksForOwner(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Task> allTasks = taskService.getAllTasks();
		return accessService.filterTasksByAccess(currentUser, allTasks);
	}

	@GetMapping("/count/total")
	public long totalTasks(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Task> allTasks = taskService.getAllTasks();
		return accessService.filterTasksByAccess(currentUser, allTasks).size();
	}

	@GetMapping("/count/pending")
	public long pendingTasks(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Task> allTasks = taskService.getPendingTasksList();
		return accessService.filterTasksByAccess(currentUser, allTasks).size();
	}

	@GetMapping("/count/completed")
	public long completedTasks(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Task> allTasks = taskService.getCompletedTasksList();
		return accessService.filterTasksByAccess(currentUser, allTasks).size();
	}

	@DeleteMapping("/{taskId}")
	public String deleteTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		taskService.deleteTask(taskId);
		return "Task Deleted Successfully";
	}

	@PutMapping("/progress/{taskId}/{progress}")
	public Task updateProgress(
			@PathVariable Long taskId,
			@PathVariable Integer progress,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.updateProgress(taskId, progress);
	}

	@GetMapping("/deadline-today")
	public long deadlineToday(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<Task> allTasks = taskService.getAllTasks();
		return accessService.filterTasksByAccess(currentUser, allTasks).stream()
				.filter(t -> t.getDueDate() != null && 
					java.time.LocalDate.now().equals(t.getDueDate()))
				.count();
	}
	
	@GetMapping("/available")
	public List<Task> getAvailableTasks(HttpServletRequest request) {
		accessService.resolveUser(request);
		return taskService.getAvailableTasks();
	}

	@PostMapping("/take/{taskId}/{userId}")
	public Task takeTask(
			@PathVariable Long taskId,
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		return taskService.takeTask(taskId, userId);
	}

	@PutMapping("/approve/{taskId}")
	public Task approveTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.updateTaskStatus(taskId, "APPROVED");
	}

	@PutMapping("/changes/{taskId}")
	public Task changesRequested(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.updateTaskStatus(taskId, "CHANGES_REQUESTED");
	}

	@PostMapping("/{taskId}/watchers/{userId}")
	public Task addWatcher(
			@PathVariable Long taskId,
			@PathVariable Long userId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.addWatcher(taskId, userId);
	}

	@GetMapping("/{taskId}/watchers")
	public List<UserDTO> getWatchers(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskService.getTaskById(taskId);
		accessService.validateTaskAccess(currentUser, task);
		return taskService.getWatchers(taskId).stream()
				.map(UserDTO::fromUser)
				.collect(Collectors.toList());
	}
	
	@GetMapping("/dashboard/{userId}/total")
	public long employeeTotal(
			@PathVariable Long userId,
			HttpServletRequest request){

		accessService.resolveAndValidateTargetUser(request, userId);
	    return taskService.getEmployeeTotalTasks(userId);
	}

	@GetMapping("/dashboard/{userId}/pending")
	public long employeePending(
			@PathVariable Long userId,
			HttpServletRequest request){

		accessService.resolveAndValidateTargetUser(request, userId);
	    return taskService.getEmployeePendingTasks(userId);
	}

	@GetMapping("/dashboard/{userId}/completed")
	public long employeeCompleted(
			@PathVariable Long userId,
			HttpServletRequest request){

		accessService.resolveAndValidateTargetUser(request, userId);
	    return taskService.getEmployeeCompletedTasks(userId);
	}

	@GetMapping("/dashboard/{userId}/deadline")
	public long employeeDeadline(
			@PathVariable Long userId,
			HttpServletRequest request){

		accessService.resolveAndValidateTargetUser(request, userId);
	    return taskService.getEmployeeDeadlineTasks(userId);
	}

	@GetMapping("/my-tasks")
	public List<Task> getMyTasks(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		return taskRepository.findByAssignedToId(currentUser.getId());
	}

	@GetMapping("/my-site")
	public List<Task> getMySiteTasks(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		// For employees, return own tasks; for supervisors/SP001/SP002, return site tasks
		if (accessService.isSupervisor(currentUser) || accessService.isManager(currentUser)
				|| accessService.isSP001(currentUser) || accessService.isSP002(currentUser)
				|| accessService.hasElevatedAccess(currentUser)) {
			return taskRepository.findByAssignedToSiteCode(currentUser.getSiteCode());
		}
		return taskRepository.findByAssignedToId(currentUser.getId());
	}
}
