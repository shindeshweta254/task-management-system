package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.taskmanagement.entity.ChecklistReportEntry;

public interface ChecklistReportEntryRepository extends JpaRepository<ChecklistReportEntry, Long> {

    List<ChecklistReportEntry> findByUserIdOrderByReportDateDescIdDesc(Long userId);

    List<ChecklistReportEntry> findAllByOrderByReportDateDescIdDesc();

    List<ChecklistReportEntry> findByUserIdAndReportDateBetweenOrderByReportDateDescIdDesc(
            Long userId, LocalDate from, LocalDate to);

    List<ChecklistReportEntry> findAllByReportDateBetweenOrderByReportDateDescIdDesc(
            LocalDate from, LocalDate to);

    @Query("SELECT e FROM ChecklistReportEntry e WHERE e.user.siteCode = :siteCode ORDER BY e.reportDate DESC, e.id DESC")
    List<ChecklistReportEntry> findByUserSiteCode(@Param("siteCode") String siteCode);

    List<ChecklistReportEntry> findByChecklistMasterId(Long checklistMasterId);
}
