package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.ChangeRequest;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long>{
	List<ChangeRequest> findByTaskId(Long taskId);
}
