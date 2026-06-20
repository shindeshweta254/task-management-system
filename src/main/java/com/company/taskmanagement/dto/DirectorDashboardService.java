package com.company.taskmanagement.dto;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.repository.AttendanceRepository;
import com.company.taskmanagement.repository.ReportRepository;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;
import com.company.taskmanagement.service.DashboardService;

@Service
public class DirectorDashboardService {
	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private AttendanceRepository attendanceRepository;

	@Autowired
	private ReportRepository dailyReportRepository;

	@Autowired
	private DashboardService dashboardService;

	public DirectorDashboardDTO getDashboard() {

		DirectorDashboardDTO dto = new DirectorDashboardDTO();

		// Employees
		dto.setTotalEmployees(userRepository.count());

		// Tasks
		dto.setTotalprojects(taskRepository.count());

		dto.setCompletedTasks(taskRepository.countByStatus("APPROVED"));

		dto.setPendingTasks(taskRepository.countByStatus("PENDING"));

		dto.setDelayedTasks(taskRepository.countByDueDateBeforeAndStatusNot(LocalDate.now(), "APPROVED"));

		// Attendance
		dto.setTotalAttendance(attendanceRepository.count());

		// Daily Reports
		dto.setMonthlyReports(dailyReportRepository.count());

		// Performance Rating
		dto.setRating(dashboardService.getRating());

		return dto;
	}

}
