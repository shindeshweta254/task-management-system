package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.dto.ExcelUploadHistoryResponse;
import com.company.taskmanagement.entity.ProjectExcelUpload;
import com.company.taskmanagement.entity.StaffExcelUpload;
import com.company.taskmanagement.entity.StaffExcelUpload.UploadStatus;
import com.company.taskmanagement.service.ExcelUploadHistoryService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/excel-uploads")
@CrossOrigin(origins = "http://localhost:5173")
public class ExcelUploadHistoryController {

    @Autowired
    private ExcelUploadHistoryService excelUploadHistoryService;

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        return ResponseEntity.ok(Map.of("status", "success", "message", "Controller is working"));
    }

    @PostMapping("/staff/history")
    public ResponseEntity<?> createStaffHistory(
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedByUserId") Long uploadedByUserId,
            @RequestParam("uploadedByName") String uploadedByName,
            @RequestParam("uploadedByRole") String uploadedByRole) {
        try {
            Long totalRecords = excelUploadHistoryService.countStaffDataRows(file);
            StaffExcelUpload rec = excelUploadHistoryService.saveStaffHistory(
                    file, uploadedByUserId, uploadedByName, uploadedByRole,
                    StaffExcelUpload.UploadStatus.SUCCESS, totalRecords);
            return ResponseEntity.ok(rec);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @PostMapping("/project/history")
    public ResponseEntity<?> createProjectHistory(
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedByUserId") Long uploadedByUserId,
            @RequestParam("uploadedByName") String uploadedByName,
            @RequestParam("uploadedByRole") String uploadedByRole,
            @RequestParam(value = "siteName", required = false) String siteName) {
        try {
            if (siteName == null || siteName.isBlank()) {
                siteName = excelUploadHistoryService.extractProjectSiteName(file);
            }
            Long totalRecords = excelUploadHistoryService.countProjectEmployees(file);
            ProjectExcelUpload rec = excelUploadHistoryService.saveProjectHistory(
                    file, uploadedByUserId, uploadedByName, uploadedByRole,
                    siteName, ProjectExcelUpload.UploadStatus.SUCCESS, totalRecords);
            return ResponseEntity.ok(rec);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/staff/{id}/rows")
    public ResponseEntity<?> getStaffRows(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(excelUploadHistoryService.getStaffRows(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/project/{id}/rows")
    public ResponseEntity<?> getProjectRows(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(excelUploadHistoryService.getProjectRows(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/staff/{id}/download")
    public ResponseEntity<Resource> downloadStaffFile(@PathVariable Long id) throws Exception {
        StaffExcelUpload rec = excelUploadHistoryService.getStaffMeta(id);
        byte[] bytes = excelUploadHistoryService.loadFileBytes(rec.getStoredFilePath());
        ByteArrayResource resource = new ByteArrayResource(bytes);
        String contentType = rec.getMimeType() != null ? rec.getMimeType() : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        String fileName = rec.getOriginalFileName() != null ? rec.getOriginalFileName() : "staff.xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(bytes.length)
                .body(resource);
    }

    @GetMapping("/project/{id}/download")
    public ResponseEntity<Resource> downloadProjectFile(@PathVariable Long id) throws Exception {
        ProjectExcelUpload rec = excelUploadHistoryService.getProjectMeta(id);
        byte[] bytes = excelUploadHistoryService.loadFileBytes(rec.getStoredFilePath());
        ByteArrayResource resource = new ByteArrayResource(bytes);
        String contentType = rec.getMimeType() != null ? rec.getMimeType() : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        String fileName = rec.getOriginalFileName() != null ? rec.getOriginalFileName() : "project.xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(bytes.length)
                .body(resource);
    }

    @GetMapping("/staff/my")
    public List<ExcelUploadHistoryResponse> listStaffMy(@RequestParam("userId") Long userId) {
        return excelUploadHistoryService.listStaffForEmployeeOrAll(userId, false)
                .stream()
                .map(r -> ExcelUploadHistoryResponse.ofStaff(
                        r.getId(), r.getOriginalFileName(), r.getUploadedByName(),
                        r.getUploadedByUserId(), r.getUploadDate(), r.getFileSize(),
                        r.getTotalRecords(), r.getStatus() != null ? r.getStatus().name() : null))
                .toList();
    }

    @GetMapping("/project/my")
    public List<ExcelUploadHistoryResponse> listProjectMy(@RequestParam("userId") Long userId) {
        return excelUploadHistoryService.listProjectForEmployeeOrAll(userId, false)
                .stream()
                .map(r -> ExcelUploadHistoryResponse.ofProject(
                        r.getId(), r.getOriginalFileName(), r.getUploadedByName(),
                        r.getUploadedByUserId(), r.getSiteName(), r.getUploadDate(),
                        r.getFileSize(), r.getTotalRecords(),
                        r.getStatus() != null ? r.getStatus().name() : null))
                .toList();
    }

    @GetMapping("/staff/all")
    public List<ExcelUploadHistoryResponse> listStaffAll() {
        return excelUploadHistoryService.listStaffForEmployeeOrAll(null, true)
                .stream()
                .map(r -> ExcelUploadHistoryResponse.ofStaff(
                        r.getId(), r.getOriginalFileName(), r.getUploadedByName(),
                        r.getUploadedByUserId(), r.getUploadDate(), r.getFileSize(),
                        r.getTotalRecords(), r.getStatus() != null ? r.getStatus().name() : null))
                .toList();
    }

    @GetMapping("/project/all")
    public List<ExcelUploadHistoryResponse> listProjectAll() {
        return excelUploadHistoryService.listProjectForEmployeeOrAll(null, true)
                .stream()
                .map(r -> ExcelUploadHistoryResponse.ofProject(
                        r.getId(), r.getOriginalFileName(), r.getUploadedByName(),
                        r.getUploadedByUserId(), r.getSiteName(), r.getUploadDate(),
                        r.getFileSize(), r.getTotalRecords(),
                        r.getStatus() != null ? r.getStatus().name() : null))
                .toList();
    }

    @GetMapping("/project/site/{siteName}")
    public List<ExcelUploadHistoryResponse> listProjectBySite(@PathVariable String siteName) {
        return excelUploadHistoryService.listProjectBySite(siteName)
                .stream()
                .map(r -> ExcelUploadHistoryResponse.ofProject(
                        r.getId(), r.getOriginalFileName(), r.getUploadedByName(),
                        r.getUploadedByUserId(), r.getSiteName(), r.getUploadDate(),
                        r.getFileSize(), r.getTotalRecords(),
                        r.getStatus() != null ? r.getStatus().name() : null))
                .toList();
    }

    @GetMapping("/staff/site/{siteName}")
    public List<ExcelUploadHistoryResponse> listStaffBySite(@PathVariable String siteName) {
        return List.of();
    }
}
