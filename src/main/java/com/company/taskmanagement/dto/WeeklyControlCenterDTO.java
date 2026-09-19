package com.company.taskmanagement.dto;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

public class WeeklyControlCenterDTO {

    private LocalDate startDate;
    private LocalDate endDate;
    private String site;

    private long totalTasks;
    private long pendingTasks;
    private long completedTasks;
    private long overdueTasks;

    private long attendanceRecords;
    private Map<String, Long> attendanceByStatus = new LinkedHashMap<>();

    private long checklistSubmissions;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(long totalTasks) {
        this.totalTasks = totalTasks;
    }

    public long getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(long pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public long getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(long completedTasks) {
        this.completedTasks = completedTasks;
    }

    public long getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(long overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public long getAttendanceRecords() {
        return attendanceRecords;
    }

    public void setAttendanceRecords(long attendanceRecords) {
        this.attendanceRecords = attendanceRecords;
    }

    public Map<String, Long> getAttendanceByStatus() {
        return attendanceByStatus;
    }

    public void setAttendanceByStatus(Map<String, Long> attendanceByStatus) {
        this.attendanceByStatus = attendanceByStatus;
    }

    public long getChecklistSubmissions() {
        return checklistSubmissions;
    }

    public void setChecklistSubmissions(long checklistSubmissions) {
        this.checklistSubmissions = checklistSubmissions;
    }
}