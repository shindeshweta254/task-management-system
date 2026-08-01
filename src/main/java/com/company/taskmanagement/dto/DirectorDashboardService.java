package com.company.taskmanagement.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Attendance;
import com.company.taskmanagement.entity.Report;
import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.entity.User;
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

	/**
	 * Get attendance of all EMPLOYEE and SUPERVISOR users for the Director dashboard.
	 * Excludes Director role and other elevated roles.
	 * Returns simple DTO with: id, name, employeeId, role, attendanceDate,
	 * checkInTime, checkOutTime, workingHours, status, location, selfie.
	 */
	public List<DirectorAttendanceDTO> getDirectorAttendance() {
		List<Attendance> allAttendance = attendanceRepository.findAll();
		List<DirectorAttendanceDTO> result = new ArrayList<>();

		for (Attendance a : allAttendance) {
			User user = a.getUser();
			if (user == null) continue;

			// Only include EMPLOYEE and SUPERVISOR roles
			Role role = user.getRole();
			if (role == null || role.getRoleName() == null) continue;
			String roleName = role.getRoleName().trim().toUpperCase();
			if (!roleName.equals("EMPLOYEE") && !roleName.equals("SUPERVISOR")) continue;

			DirectorAttendanceDTO dto = new DirectorAttendanceDTO();
			dto.setId(a.getId());
			dto.setName(user.getName());
			dto.setEmployeeId(user.getEmployeeId());
			dto.setRole(role.getRoleName());
			dto.setAttendanceDate(a.getAttendanceDate());
			dto.setCheckInTime(a.getCheckInTime());
			dto.setCheckOutTime(a.getCheckOutTime());
			dto.setWorkingHours(a.getWorkingHours());
			dto.setStatus(a.getStatus());
			dto.setLocation(a.getLocation());

			// Try to get selfie from Report entity
			String selfiePath = findSelfieFor(user.getId(), a.getAttendanceDate());
			dto.setSelfie(selfiePath);

			result.add(dto);
		}

		// Sort by date descending, then name ascending
		result.sort((r1, r2) -> {
			LocalDate d1 = r1.getAttendanceDate();
			LocalDate d2 = r2.getAttendanceDate();
			if (d1 != null && d2 != null) {
				int dateCmp = d2.compareTo(d1);
				if (dateCmp != 0) return dateCmp;
			} else if (d1 != null) {
				return -1;
			} else if (d2 != null) {
				return 1;
			}
			String n1 = r1.getName() != null ? r1.getName() : "";
			String n2 = r2.getName() != null ? r2.getName() : "";
			return n1.compareTo(n2);
		});

		return result;
	}

	/**
	 * Find the selfie/proof file path from the Report entity for the given user on the given date.
	 */
	private String findSelfieFor(Long userId, LocalDate date) {
		if (userId == null || date == null) return null;
		List<Report> userReports = dailyReportRepository.findByUserId(userId);
		if (userReports == null || userReports.isEmpty()) return null;
		return userReports.stream()
				.filter(r -> r.getReportDate() != null && r.getReportDate().equals(date))
				.findFirst()
				.map(r -> {
					if (r.getProofFilePath() != null && !r.getProofFilePath().isBlank()) {
						return r.getProofFilePath();
					}
					return r.getProofFileName();
				})
				.orElse(null);
	}
}
