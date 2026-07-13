package com.company.taskmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findBySiteName(String siteName);
}
