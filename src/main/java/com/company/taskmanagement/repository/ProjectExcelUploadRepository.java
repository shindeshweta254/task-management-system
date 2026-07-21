package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.ProjectExcelUpload;

public interface ProjectExcelUploadRepository extends JpaRepository<ProjectExcelUpload, Long> {

    List<ProjectExcelUpload> findByUploadedByUserIdOrderByUploadDateDesc(Long userId);

    List<ProjectExcelUpload> findBySiteNameOrderByUploadDateDesc(String siteName);

    List<ProjectExcelUpload> findAllByOrderByUploadDateDesc();
}

