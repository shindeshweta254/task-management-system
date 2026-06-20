package com.company.taskmanagement.dto;

public class DirectorDashboardDTO {

	private long totalEmployees;
	private long totalprojects;

	public long getTotalprojects() {
		return totalprojects;
	}

	public void setTotalprojects(long totalprojects) {
		this.totalprojects = totalprojects;
	}

	public long getMonthlyReports() {
		return monthlyReports;
	}

	public void setMonthlyReports(long monthlyReports) {
		this.monthlyReports = monthlyReports;
	}

	public long getPerformance() {
		return performance;
	}

	public void setPerformance(long performance) {
		this.performance = performance;
	}

	private long completedTasks;
	private long pendingTasks;
	private long delayedTasks;
	private long totalAttendance;
	private long monthlyReports;
	private double rating;
	private long performance;

	public long getTotalEmployees() {
		return totalEmployees;
	}

	public void setTotalEmployees(long totalEmployees) {
		this.totalEmployees = totalEmployees;
	}

	public long getCompletedTasks() {
		return completedTasks;
	}

	public void setCompletedTasks(long completedTasks) {
		this.completedTasks = completedTasks;
	}

	public long getPendingTasks() {
		return pendingTasks;
	}

	public void setPendingTasks(long pendingTasks) {
		this.pendingTasks = pendingTasks;
	}

	public long getDelayedTasks() {
		return delayedTasks;
	}

	public void setDelayedTasks(long delayedTasks) {
		this.delayedTasks = delayedTasks;
	}

	public long getTotalAttendance() {
		return totalAttendance;
	}

	public void setTotalAttendance(long totalAttendance) {
		this.totalAttendance = totalAttendance;
	}

	public double getRating() {
		return rating;
	}

	public void setRating(double rating) {
		this.rating = rating;
	}

}
