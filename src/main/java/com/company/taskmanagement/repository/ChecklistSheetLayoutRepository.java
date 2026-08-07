package com.company.taskmanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.ChecklistSheetLayout;

public interface ChecklistSheetLayoutRepository extends JpaRepository<ChecklistSheetLayout, Long> {

    Optional<ChecklistSheetLayout> findTopBySheetNameOrderByIdDesc(String sheetName);

    List<ChecklistSheetLayout> findBySheetNameOrderByIdDesc(String sheetName);
}
