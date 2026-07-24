package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Notification;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.NotificationRepository;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class TaskService {
	@Autowired
	TaskRepository taskRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private NotificationRepository notificationRepository;

	public Task takeTask(Long taskId, Long userId) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User Not Found"));

		task.setAssignedTo(user);
		Task savedTask = taskRepository.save(task);
		System.out.println("=== takeTask: Task " + savedTask.getId() + " assigned to user " + userId);

		// Auto-create notification for self-assignment
		try {
			String message = "You have been assigned a new task: " + task.getTaskTitle();
			Notification notification = new Notification();
			notification.setUserId(user.getId());
			notification.setTitle("New Task Assigned");
			notification.setMessage(message);
			notification.setType("TASK_ASSIGNED");
			notification.setTaskId(savedTask.getId());
			notification.setRead(false);
			notification.setCreatedAt(java.time.LocalDateTime.now());
			Notification savedNotification = notificationRepository.save(notification);
			System.out.println("takeTask NOTIFICATION CREATED: ID=" + savedNotification.getId() + ", userId=" + savedNotification.getUserId());
		} catch (Exception e) {
			System.err.println("takeTask FAILED to create notification: " + e.getMessage());
		}

		return savedTask;
	}

	public Task saveTask(Task task) {
		// Log the incoming task assignment info
		Long assignedUserId = (task.getAssignedTo() != null) ? task.getAssignedTo().getId() : null;
		System.out.println("=== TASK SAVE START ===");
		System.out.println("Task title: " + task.getTaskTitle());
		System.out.println("Assigned to user ID from request: " + assignedUserId);

		Task savedTask = taskRepository.save(task);
		System.out.println("Saved task ID: " + savedTask.getId());

		// Auto-create notification if task is assigned to someone
		if (assignedUserId != null) {
			try {
				User assignedUser = userRepository.findById(assignedUserId).orElse(null);

				if (assignedUser != null) {
					System.out.println("Assigned user found: ID=" + assignedUser.getId()
							+ ", employeeId=" + assignedUser.getEmployeeId()
							+ ", name=" + assignedUser.getName());

					// Use a generic assigner description since we don't have a createdBy field
					String assignerDescription = "A manager";
					if (assignedUser.getRole() != null) {
						assignerDescription = assignedUser.getRole().getRoleName();
					}
					// Default to a generic message
					String message = "A manager assigned you a new task: " + task.getTaskTitle();

					Notification notification = new Notification();
					notification.setUserId(assignedUser.getId());
					notification.setTitle("New Task Assigned");
					notification.setMessage(message);
					notification.setType("TASK_ASSIGNED");
					notification.setTaskId(savedTask.getId());
					notification.setRead(false);
					notification.setCreatedAt(java.time.LocalDateTime.now());

					Notification savedNotification = notificationRepository.save(notification);
					System.out.println("NOTIFICATION CREATED: ID=" + savedNotification.getId()
							+ ", userId=" + savedNotification.getUserId()
							+ ", taskId=" + savedNotification.getTaskId()
							+ ", message=" + savedNotification.getMessage());
				} else {
					System.out.println("WARNING: Assigned user NOT FOUND for ID: " + assignedUserId);
				}
			} catch (Exception e) {
				System.err.println("FAILED to create notification: " + e.getMessage());
				e.printStackTrace();
			}
		} else {
			System.out.println("Task has no assignedTo — skipping notification");
		}

		System.out.println("=== TASK SAVE END ===");
		return savedTask;
	}

	public List<Task> getAllTasks() {
		return taskRepository.findAll();
	}

	public Task updateTaskStatus(Long taskId, String status) {

		Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task Not Found"));

		// Store old status before update for dedup check
		String oldStatus = task.getStatus();

		task.setStatus(status);

		Task savedTask = taskRepository.save(task);

		// === Create notifications based on new status ===
		try {
			if ("COMPLETED".equals(status) && !"COMPLETED".equals(oldStatus)) {
				// 1. Notify the assigned employee that they completed the task
				User assignedUser = task.getAssignedTo();
				if (assignedUser != null) {
					Long completedByUserId = assignedUser.getId();
					System.out.println("Completed by user ID: " + completedByUserId);

					// Check for duplicate TASK_COMPLETED notification
					List<Notification> existingCompleted = notificationRepository
							.findByUserIdAndTaskIdAndType(completedByUserId, savedTask.getId(), "TASK_COMPLETED");
					if (existingCompleted == null || existingCompleted.isEmpty()) {
						Notification notifyEmployee = new Notification();
						notifyEmployee.setUserId(completedByUserId);
						notifyEmployee.setTitle("Task Completed");
						notifyEmployee.setMessage("You completed the task: " + task.getTaskTitle());
						notifyEmployee.setType("TASK_COMPLETED");
						notifyEmployee.setTaskId(savedTask.getId());
						notifyEmployee.setRead(false);
						notifyEmployee.setCreatedAt(java.time.LocalDateTime.now());
						notificationRepository.save(notifyEmployee);
						System.out.println("TASK_COMPLETED notification created for user " + completedByUserId);
					}

					// 2. Notify the reviewer that task is ready for review
					Long reviewerUserId = null;
					User reviewerUser = task.getReviewer();
					if (reviewerUser != null) {
						reviewerUserId = reviewerUser.getId();
					}
					System.out.println("Reviewer user ID: " + reviewerUserId);

					if (reviewerUserId != null) {
						// Check for duplicate TASK_READY_FOR_REVIEW notification
						List<Notification> existingReview = notificationRepository
								.findByUserIdAndTaskIdAndType(reviewerUserId, savedTask.getId(), "TASK_READY_FOR_REVIEW");
						if (existingReview == null || existingReview.isEmpty()) {
							String employeeName = assignedUser.getName() != null ? assignedUser.getName() : "An employee";
							Notification notifyReviewer = new Notification();
							notifyReviewer.setUserId(reviewerUserId);
							notifyReviewer.setTitle("Task Ready for Review");
							notifyReviewer.setMessage(employeeName + " completed the task \"" + task.getTaskTitle() + "\". Please review it.");
							notifyReviewer.setType("TASK_READY_FOR_REVIEW");
							notifyReviewer.setTaskId(savedTask.getId());
							notifyReviewer.setRead(false);
							notifyReviewer.setCreatedAt(java.time.LocalDateTime.now());
							notificationRepository.save(notifyReviewer);
							System.out.println("TASK_READY_FOR_REVIEW notification created for reviewer " + reviewerUserId);
						}
					} else {
						System.out.println("No reviewer found for task " + savedTask.getId() + " — skipping review notification");
					}
					System.out.println("Completion notifications created");
				}
			} else if ("APPROVED".equals(status) && !"APPROVED".equals(oldStatus)) {
				// Notify the assigned employee that task is approved
				User assignedUser = task.getAssignedTo();
				if (assignedUser != null) {
					List<Notification> existing = notificationRepository
							.findByUserIdAndTaskIdAndType(assignedUser.getId(), savedTask.getId(), "TASK_APPROVED");
					if (existing == null || existing.isEmpty()) {
						Notification notification = new Notification();
						notification.setUserId(assignedUser.getId());
						notification.setTitle("Task Approved");
						notification.setMessage("Your task \"" + task.getTaskTitle() + "\" has been approved.");
						notification.setType("TASK_APPROVED");
						notification.setTaskId(savedTask.getId());
						notification.setRead(false);
						notification.setCreatedAt(java.time.LocalDateTime.now());
						notificationRepository.save(notification);
						System.out.println("TASK_APPROVED notification created for user " + assignedUser.getId());
					}
				}
			} else if ("CHANGES_REQUESTED".equals(status) && !"CHANGES_REQUESTED".equals(oldStatus)) {
				// Notify the assigned employee that changes are requested
				User assignedUser = task.getAssignedTo();
				if (assignedUser != null) {
					List<Notification> existing = notificationRepository
							.findByUserIdAndTaskIdAndType(assignedUser.getId(), savedTask.getId(), "TASK_CHANGES_REQUESTED");
					if (existing == null || existing.isEmpty()) {
						Notification notification = new Notification();
						notification.setUserId(assignedUser.getId());
						notification.setTitle("Changes Requested");
						notification.setMessage("Changes were requested for the task \"" + task.getTaskTitle() + "\".");
						notification.setType("TASK_CHANGES_REQUESTED");
						notification.setTaskId(savedTask.getId());
						notification.setRead(false);
						notification.setCreatedAt(java.time.LocalDateTime.now());
						notificationRepository.save(notification);
						System.out.println("TASK_CHANGES_REQUESTED notification created for user " + assignedUser.getId());
					}
				}
			}
		} catch (Exception e) {
			System.err.println("Failed to create status-change notification: " + e.getMessage());
			e.printStackTrace();
		}

		return savedTask;
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
