package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Responsibility;

public interface ResponsibilityRepository extends JpaRepository<Responsibility, Long> {
	List<Responsibility> findByRoleId(Long roleId);
}
