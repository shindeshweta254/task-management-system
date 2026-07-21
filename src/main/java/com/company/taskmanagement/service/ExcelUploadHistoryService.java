package com.company.taskmanagement.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.dto.ExcelTableResponse;
import com.company.taskmanagement.entity.ProjectExcelUpload;
import com.company.taskmanagement.entity.StaffExcelUpload;
import com.company.taskmanagement.repository.ProjectExcelUploadRepository;
import com.company.taskmanagement.repository.StaffExcelUploadRepository;

@Service
public class ExcelUploadHistoryService {

    @Autowired
    private StaffExcelUploadRepository staffExcelUploadRepository;

    @Autowired
    private ProjectExcelUploadRepository projectExcelUploadRepository;

    @Autowired
    private ExcelTableParser excelTableParser;

    private final Path uploadRoot = Paths.get("uploads/excel-uploads");

    public Long countStaffDataRows(MultipartFile file) throws Exception {
        return (long) excelTableParser.parseFirstSheetAsTable(file.getInputStream()).size();
    }

    public Long countProjectEmployees(MultipartFile file) throws Exception {
        return (long) excelTableParser.parseFirstSheetAsTable(file.getInputStream()).size();
    }

    public String extractProjectSiteName(MultipartFile file) {
        return "Unknown";
    }

    public StaffExcelUpload saveStaffHistory(
            MultipartFile file,
            Long uploadedByUserId,
            String uploadedByName,
            String uploadedByRole,
            StaffExcelUpload.UploadStatus status,
            Long totalRecords) throws IOException {

        if (!Files.exists(uploadRoot)) {
            Files.createDirectories(uploadRoot);
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "staff.xlsx";
        String safeName = System.currentTimeMillis() + "_" + originalName.replaceAll("\\s+", "_");
        Path targetPath = uploadRoot.resolve(safeName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        StaffExcelUpload rec = new StaffExcelUpload();
        rec.setOriginalFileName(originalName);
        rec.setStoredFileName(safeName);
        rec.setStoredFilePath(targetPath.toString());
        rec.setMimeType(file.getContentType());
        rec.setFileSize(file.getSize());
        rec.setUploadedByUserId(uploadedByUserId);
        rec.setUploadedByName(uploadedByName);
        rec.setUploadedByRole(uploadedByRole);
        rec.setUploadDate(LocalDateTime.now());
        rec.setTotalRecords(totalRecords);
        rec.setStatus(status);

        return staffExcelUploadRepository.save(rec);
    }

    public ProjectExcelUpload saveProjectHistory(
            MultipartFile file,
            Long uploadedByUserId,
            String uploadedByName,
            String uploadedByRole,
            String siteName,
            ProjectExcelUpload.UploadStatus status,
            Long totalRecords) throws IOException {

        if (!Files.exists(uploadRoot)) {
            Files.createDirectories(uploadRoot);
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "project.xlsx";
        String safeName = System.currentTimeMillis() + "_" + originalName.replaceAll("\\s+", "_");
        Path targetPath = uploadRoot.resolve(safeName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        ProjectExcelUpload rec = new ProjectExcelUpload();
        rec.setOriginalFileName(originalName);
        rec.setStoredFileName(safeName);
        rec.setStoredFilePath(targetPath.toString());
        rec.setMimeType(file.getContentType());
        rec.setFileSize(file.getSize());
        rec.setUploadedByUserId(uploadedByUserId);
        rec.setUploadedByName(uploadedByName);
        rec.setUploadedByRole(uploadedByRole);
        rec.setSiteName(siteName);
        rec.setUploadDate(LocalDateTime.now());
        rec.setTotalRecords(totalRecords);
        rec.setStatus(status);

        return projectExcelUploadRepository.save(rec);
    }

    public ExcelTableResponse getStaffRows(Long id) throws Exception {
        StaffExcelUpload rec = staffExcelUploadRepository.findById(id).orElseThrow();
        ExcelTableResponse resp = new ExcelTableResponse();
        resp.setRows(excelTableParser.parseFirstSheetAsTable(Files.newInputStream(Path.of(rec.getStoredFilePath()))));
        return resp;
    }

    public ExcelTableResponse getProjectRows(Long id) throws Exception {
        ProjectExcelUpload rec = projectExcelUploadRepository.findById(id).orElseThrow();
        ExcelTableResponse resp = new ExcelTableResponse();
        resp.setRows(excelTableParser.parseFirstSheetAsTable(Files.newInputStream(Path.of(rec.getStoredFilePath()))));
        return resp;
    }

    public StaffExcelUpload getStaffMeta(Long id) {
        return staffExcelUploadRepository.findById(id).orElseThrow();
    }

    public ProjectExcelUpload getProjectMeta(Long id) {
        return projectExcelUploadRepository.findById(id).orElseThrow();
    }

    public byte[] loadFileBytes(String storedFilePath) throws IOException {
        return Files.readAllBytes(Path.of(storedFilePath));
    }

    public List<StaffExcelUpload> listStaffForEmployeeOrAll(Long userId, boolean all) {
        if (all) return staffExcelUploadRepository.findAllByOrderByUploadDateDesc();
        return staffExcelUploadRepository.findByUploadedByUserIdOrderByUploadDateDesc(userId);
    }

    public List<ProjectExcelUpload> listProjectForEmployeeOrAll(Long userId, boolean all) {
        if (all) return projectExcelUploadRepository.findAllByOrderByUploadDateDesc();
        return projectExcelUploadRepository.findByUploadedByUserIdOrderByUploadDateDesc(userId);
    }

    public List<ProjectExcelUpload> listProjectBySite(String siteName) {
        return projectExcelUploadRepository.findBySiteNameOrderByUploadDateDesc(siteName);
    }
}
