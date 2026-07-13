package com.company.taskmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.company.taskmanagement.entity.ProjectEmployee;

public interface ProjectEmployeeRepository extends JpaRepository<ProjectEmployee, Long> {
}
