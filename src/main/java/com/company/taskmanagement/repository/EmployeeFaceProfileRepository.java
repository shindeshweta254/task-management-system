package com.company.taskmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.EmployeeFaceProfile;

public interface EmployeeFaceProfileRepository
        extends JpaRepository<EmployeeFaceProfile, Long> {

    Optional<EmployeeFaceProfile> findByUserId(Long userId);

    java.util.List<EmployeeFaceProfile> findByActiveTrue();
}
