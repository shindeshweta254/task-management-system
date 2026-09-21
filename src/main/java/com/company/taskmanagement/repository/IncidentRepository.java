package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Incident;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findAllByOrderByCreatedAtDesc();

    List<Incident> findBySiteCodeIgnoreCaseOrderByCreatedAtDesc(String siteCode);

    List<Incident> findByReportedByIdOrderByCreatedAtDesc(Long userId);

    List<Incident> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    List<Incident> findBySiteCodeIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(
            String siteCode,
            String status);
}