package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.dto.AttendanceReportDTO;
import com.company.taskmanagement.dto.WeeklyControlCenterDTO;
import com.company.taskmanagement.entity.ChecklistReportEntry;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.ChecklistReportEntryRepository;
import com.company.taskmanagement.repository.TaskRepository;

@Service
public class WeeklyControlCenterService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ChecklistReportEntryRepository checklistReportEntryRepository;

    @Autowired
    private AttendanceReportService attendanceReportService;

    @Autowired
    private AccessService accessService;

    public WeeklyControlCenterDTO getWeeklySummary(
            User currentUser,
            LocalDate startDate,
            LocalDate endDate,
            String site) {

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        String siteFilter = normalize(site);

        List<Task> tasks = taskRepository.findAll().stream()
                .filter(task -> isTaskAccessible(currentUser, task))
                .filter(task -> matchesSite(task, siteFilter))
                .filter(task -> isTaskInRange(task, startDate, endDate))
                .collect(Collectors.toList());

        List<AttendanceReportDTO> attendance = attendanceReportService
                .getAttendanceReports(
                        currentUser,
                        startDate,
                        endDate,
                        siteFilter,
                        null,
                        null,
                        null);

        List<ChecklistReportEntry> checklistEntries =
                checklistReportEntryRepository
                        .findAllByReportDateBetweenOrderByReportDateDescIdDesc(
                                startDate,
                                endDate)
                        .stream()
                        .filter(entry -> hasChecklistAccess(currentUser, entry))
                        .filter(entry -> siteFilter == null
                                || equalsIgnoreCase(entry.getSiteCode(), siteFilter))
                        .collect(Collectors.toList());

        WeeklyControlCenterDTO dto = new WeeklyControlCenterDTO();
        dto.setStartDate(startDate);
        dto.setEndDate(endDate);
        dto.setSite(siteFilter);

        dto.setTotalTasks(tasks.size());

        dto.setPendingTasks(tasks.stream()
                .filter(task -> "PENDING".equalsIgnoreCase(task.getStatus()))
                .count());

        dto.setCompletedTasks(tasks.stream()
                .filter(task -> "COMPLETED".equalsIgnoreCase(task.getStatus()))
                .count());

        dto.setOverdueTasks(tasks.stream()
                .filter(task -> task.getDueDate() != null)
                .filter(task -> task.getDueDate().isBefore(endDate.plusDays(1)))
                .filter(task -> !"COMPLETED".equalsIgnoreCase(task.getStatus()))
                .count());

        dto.setAttendanceRecords(attendance.size());

        Map<String, Long> attendanceByStatus = attendance.stream()
                .collect(Collectors.groupingBy(
                        record -> {
                            String status = record.getStatus();
                            return status == null || status.isBlank()
                                    ? "UNKNOWN"
                                    : status.toUpperCase(Locale.ROOT);
                        },
                        LinkedHashMap::new,
                        Collectors.counting()));

        dto.setAttendanceByStatus(attendanceByStatus);
        dto.setChecklistSubmissions(checklistEntries.size());

        return dto;
    }

    private boolean isTaskAccessible(User currentUser, Task task) {
        if (task == null || task.getAssignedTo() == null) {
            return false;
        }

        try {
            accessService.validateTargetEmployee(
                    currentUser,
                    task.getAssignedTo());
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private boolean matchesSite(Task task, String siteFilter) {
        if (siteFilter == null) {
            return true;
        }

        User assignedTo = task.getAssignedTo();
        return assignedTo != null
                && equalsIgnoreCase(assignedTo.getSiteCode(), siteFilter);
    }

    private boolean isTaskInRange(
            Task task,
            LocalDate startDate,
            LocalDate endDate) {

        LocalDate taskStart = task.getStartDate();
        LocalDate taskDue = task.getDueDate();

        if (taskStart == null && taskDue == null) {
            return false;
        }

        if (taskStart == null) {
            return !taskDue.isBefore(startDate)
                    && !taskDue.isAfter(endDate);
        }

        if (taskDue == null) {
            return !taskStart.isBefore(startDate)
                    && !taskStart.isAfter(endDate);
        }

        return !taskDue.isBefore(startDate)
                && !taskStart.isAfter(endDate);
    }

    private boolean hasChecklistAccess(
            User currentUser,
            ChecklistReportEntry entry) {

        if (entry == null) {
            return false;
        }

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)) {
            return true;
        }

        String siteCode = entry.getSiteCode();
        return siteCode != null
                && accessService.hasSiteAccess(currentUser, siteCode);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null
                && right != null
                && left.trim().equalsIgnoreCase(right.trim());
    }
}