package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class TaskService {
	@Autowired
	TaskRepository taskRepository;

	@Autowired
	private UserRepository userRepository;

	public Task takeTask(Long taskId, Long userId) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User Not Found"));

		task.setAssignedTo(user);

		return taskRepository.save(task);
	}

	public Task saveTask(Task task) {
		return taskRepository.save(task);
	}

	public List<Task> getAllTasks() {
		return taskRepository.findAll();
	}

	public Task updateTaskStatus(Long taskId, String status) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		task.setStatus(status);

		return taskRepository.save(task);
	}

	public List<Task> getTasksByEmployee(Long userId) {

		return taskRepository.findByAssignedToId(userId);

	}

	public long getPendingTasks() {
		return taskRepository.countByStatus("PENDING");
	}

	public long getCompletedTasks() {
		return taskRepository.countByStatus("COMPLETED");
	}

	public long getTotalTasks() {
		return taskRepository.count();
	}

	public long getTodayDeadlineTasks() {
		return taskRepository.countByDueDate(LocalDate.now());
	}

	public void deleteTask(Long taskId) {
		taskRepository.deleteById(taskId);
	}

	public Task updateProgress(Long taskId, Integer progress) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		task.setProgressPercentage(progress);

		return taskRepository.save(task);
	}

	public List<Task> getAvailableTasks() {

		return taskRepository.findByAssignedToIsNull();
	}

	public Task addWatcher(Long taskId, Long userId) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User Not Found"));

		task.getWatchers().add(user);

		return taskRepository.save(task);
	}

	public List<User> getWatchers(Long taskId) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		return task.getWatchers();
	}
	
	public long getEmployeeTotalTasks(Long userId){

	    return taskRepository.countByAssignedToId(userId);

	}

	public long getEmployeePendingTasks(Long userId){

	    return taskRepository.countByAssignedToIdAndStatus(
	            userId,
	            "PENDING"
	    );

	}

	public long getEmployeeCompletedTasks(Long userId){

	    return taskRepository.countByAssignedToIdAndStatus(
	            userId,
	            "COMPLETED"
	    );

	}

	public long getEmployeeDeadlineTasks(Long userId){

	    return taskRepository
	            .findByAssignedToId(userId)
	            .stream()
	            .filter(task ->
	                    task.getDueDate()!=null &&
	                    task.getDueDate().isBefore(LocalDate.now()) &&
	                    !"COMPLETED".equals(task.getStatus()))
	            .count();

	}
}
