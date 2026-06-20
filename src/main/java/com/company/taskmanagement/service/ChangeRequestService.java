package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.ChangeRequest;
import com.company.taskmanagement.repository.ChangeRequestRepository;

@Service
public class ChangeRequestService {

	@Autowired
	ChangeRequestRepository changeRequestRepository;

	public ChangeRequest saveChangeRequest(ChangeRequest changeRequest) {

		changeRequest.setCreatedAt(LocalDateTime.now());

		return changeRequestRepository.save(changeRequest);
	}

	public List<ChangeRequest> getByTask(Long taskId) {

		return changeRequestRepository.findByTaskId(taskId);
	}

}
