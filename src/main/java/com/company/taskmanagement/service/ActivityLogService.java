package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Activitylog;
import com.company.taskmanagement.repository.ActivityLogRepository;

@Service
public class ActivityLogService {

	@Autowired
	private ActivityLogRepository activityLogRepository;

	public Activitylog saveLog(Activitylog activityLog) {

		activityLog.setCreatedAt(LocalDateTime.now());

		return activityLogRepository.save(activityLog);
	}

	public List<Activitylog> getAllLogs() {

		return activityLogRepository.findAll();
	}

	public List<Activitylog> getTodayLogs() {

		LocalDateTime start = LocalDateTime.now().toLocalDate().atStartOfDay();

		LocalDateTime end = start.plusDays(1);

		return activityLogRepository.findByCreatedAtBetween(start, end);
	}

}
