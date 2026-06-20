package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.TaskAttachment;
import com.company.taskmanagement.repository.TaskAttachmentRepository;
import java.io.File;
import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

@Service
public class TaskAttachmentService {
	@Autowired
	private TaskAttachmentRepository taskAttachmentRepository;
	private final String UPLOAD_DIR = "uploads/";

	public TaskAttachment saveAttachment(TaskAttachment attachment) {

		return taskAttachmentRepository.save(attachment);
	}

	public List<TaskAttachment> getAttachmentsByTask(Long taskId) {

		return taskAttachmentRepository.findByTaskId(taskId);
	}

	public TaskAttachment uploadFile(MultipartFile file,
	        TaskAttachment attachment) throws IOException {

	    String contentType = file.getContentType();

	    if (!(contentType.equals("application/pdf")
	            || contentType.contains("spreadsheet")
	            || contentType.contains("excel")
	            || contentType.startsWith("image/"))) {

	        throw new RuntimeException(
	                "Only PDF, Excel and Screenshot files are allowed");
	    }

	    File directory = new File(UPLOAD_DIR);

	    if (!directory.exists()) {
	        directory.mkdirs();
	    }

	    String filePath = UPLOAD_DIR + file.getOriginalFilename();

	    file.transferTo(new File(filePath));

	    attachment.setFileName(file.getOriginalFilename());
	    attachment.setFilePath(filePath);
	    attachment.setFileType(contentType);

	    return taskAttachmentRepository.save(attachment);
	}
}
