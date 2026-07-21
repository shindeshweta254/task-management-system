package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.StaffExcelUpload;

public interface StaffExcelUploadRepository extends JpaRepository<StaffExcelUpload, Long> {

    List<StaffExcelUpload> findByUploadedByUserIdOrderByUploadDateDesc(Long userId);

    List<StaffExcelUpload> findAllByOrderByUploadDateDesc();
}

