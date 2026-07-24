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

import com.company.taskmanagement.entity.Activitylog;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.TaskAttachment;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ActivityLogService;
import com.company.taskmanagement.service.TaskAttachmentService;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/attachments")
public class TaskAttachmentController {

	@Autowired
	TaskAttachmentService attachmentService;

	@Autowired
	private AccessService accessService;

	@Autowired
	private ActivityLogService activityLogService;

	@Autowired
	private TaskRepository taskRepository;

	@PostMapping
	public TaskAttachment saveAttachment(@RequestBody TaskAttachment attachment, HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		if (attachment.getTask() != null && attachment.getTask().getId() != null) {
			Task task = taskRepository.findById(attachment.getTask().getId())
					.orElseThrow(() -> new RuntimeException("Task Not Found"));
			accessService.validateTaskAccess(currentUser, task);
		}
		return attachmentService.saveAttachment(attachment);
	}

	@GetMapping("/task/{taskId}")
	public List<TaskAttachment> getAttachmentsByTask(
			@PathVariable Long taskId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task Not Found"));
		accessService.validateTaskAccess(currentUser, task);
		return attachmentService.getAttachmentsByTask(taskId);
	}

	@PostMapping("/upload")
	public String uploadFile(
			@RequestParam("file") MultipartFile file,
			@RequestParam("taskId") Long taskId,
			HttpServletRequest request) throws IOException {

		User currentUser = accessService.resolveUser(request);
		Task task = taskRepository.findById(taskId)
				.orElseThrow(() -> new RuntimeException("Task Not Found"));
		accessService.validateTaskAccess(currentUser, task);

		TaskAttachment attachment = new TaskAttachment();
		attachment.setTask(task);
		attachmentService.uploadFile(file, attachment);

		Activitylog log = new Activitylog();
		log.setAction("Task Submitted For Review");
		log.setUsername(task.getAssignedTo().getName());
		log.setTask(task);
		activityLogService.saveLog(log);

		return task.getTaskTitle() + " Successfully Completed";
	}
}
