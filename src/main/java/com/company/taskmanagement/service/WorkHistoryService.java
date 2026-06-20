package com.company.taskmanagement.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.dto.WorkHistoryDTO;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.TaskAttachment;
import com.company.taskmanagement.repository.ReviewRepository;
import com.company.taskmanagement.repository.TaskAttachmentRepository;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.entity.Review;

@Service

public class WorkHistoryService {

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private TaskAttachmentRepository attachmentRepository;

	@Autowired
	private ReviewRepository reviewRepository;

	public List<WorkHistoryDTO> getWorkHistory(Long userId) {

		List<Task> tasks = taskRepository.findByAssignedToIdAndStatus(userId, "APPROVED");
		System.out.println("Tasks Found = " + tasks.size());

		List<WorkHistoryDTO> history = new ArrayList<>();

		for (Task task : tasks) {

			WorkHistoryDTO dto = new WorkHistoryDTO();

			dto.setTaskName(task.getTaskTitle());

			dto.setStartDate(String.valueOf(task.getStartDate()));

			dto.setEndDate(String.valueOf(task.getDueDate()));

			TaskAttachment attachment = attachmentRepository.findFirstByTaskId(task.getId());

			if (attachment != null) {
				dto.setFileName(attachment.getFileName());
			}

			Review review = reviewRepository.findByTaskId(task.getId());

			if (review != null) {

				if (review.getPositiveScore() != null && review.getPositiveScore() > 0) {

					dto.setScore("POSITIVE");
				}

				else if (review.getNegativeScore() != null && review.getNegativeScore() > 0) {

					dto.setScore("NEGATIVE");
				}

				else {

					dto.setScore("NO SCORE");
				}
			}

			history.add(dto);
		}

		return history;
	}
}
