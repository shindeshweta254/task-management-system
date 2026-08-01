package com.company.taskmanagement.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.company.taskmanagement.entity.ChecklistMaster;

public interface ChecklistMasterRepository extends JpaRepository<ChecklistMaster, Long> {
	List<ChecklistMaster> findBySheetNameOrderBySequenceNoAsc(String sheetName);

	@Query("SELECT DISTINCT c.sheetName FROM ChecklistMaster c WHERE c.sheetName IS NOT NULL AND c.sheetName <> '' ORDER BY c.sheetName ASC")
	List<String> findDistinctSheetNames();
}
