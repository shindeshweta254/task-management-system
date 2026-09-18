package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.ClientFollowUp;

public interface ClientFollowUpRepository extends JpaRepository<ClientFollowUp, Long> {

    List<ClientFollowUp> findAllByOrderByCreatedAtDesc();

    List<ClientFollowUp> findByClientIdOrderByCreatedAtDesc(
            Long clientId);

    List<ClientFollowUp> findBySiteCodeIgnoreCaseOrderByCreatedAtDesc(
            String siteCode);

    List<ClientFollowUp> findByFollowUpDateAndCompletedFalseOrderByCreatedAtAsc(
            LocalDate followUpDate);

    List<ClientFollowUp> findByFollowUpDateBeforeAndCompletedFalseOrderByFollowUpDateAsc(
            LocalDate date);

    List<ClientFollowUp> findByClientIdAndCompletedFalseOrderByFollowUpDateAsc(
            Long clientId);
}