package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.taskmanagement.entity.Task;

public interface TaskRepository extends JpaRepository<Task, Long> {
	List<Task> findByAssignedToId(Long userId);

	long countByStatus(String status);

	long countByAssignedToId(Long userId);

	long countByAssignedToIdAndStatus(Long userId, String status);

	long countByDueDate(LocalDate dueDate);

	long countByDueDateBeforeAndStatusNot(LocalDate date, String status);

	List<Task> findByAssignedToIsNull();

	List<Task> findByAssignedToIdAndStatus(Long userId, String string);

	List<Task> findByStatus(String status);

	/**
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
	@Query("SELECT t FROM Task t WHERE t.assignedTo.siteCode = :siteCode")
	List<Task> findByAssignedToSiteCode(@Param("siteCode") String siteCode);

	@Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.siteCode = :siteCode AND t.status = :status")
	long countByAssignedToSiteCodeAndStatus(@Param("siteCode") String siteCode, @Param("status") String status);

	@Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.siteCode = :siteCode")
	long countByAssignedToSiteCode(@Param("siteCode") String siteCode);
}
