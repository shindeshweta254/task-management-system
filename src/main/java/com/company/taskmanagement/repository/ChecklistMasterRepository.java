package com.company.taskmanagement.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.company.taskmanagement.entity.ChecklistMaster;

public interface ChecklistMasterRepository extends JpaRepository<ChecklistMaster, Long> {
	List<ChecklistMaster> findBySheetNameOrderBySequenceNoAsc(String sheetName);
}
