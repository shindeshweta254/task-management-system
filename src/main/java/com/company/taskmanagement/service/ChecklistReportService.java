package com.company.taskmanagement.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.entity.ChecklistReportEntry;
import com.company.taskmanagement.entity.ChecklistSheetLayout;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.ChecklistReportEntryRepository;
import com.company.taskmanagement.repository.ChecklistSheetLayoutRepository;

/**
 * Service-layer for the Checklist Report API. Persists each checklist row into
 * the checklist_report_entry table and returns DTO-shaped maps for the
 * frontend (Employee/Supervisor history + Director "Updated Checklist").
 *
 * Does NOT change authentication, roles, or existing tables.
 */
@Service
public class ChecklistReportService {

    @Autowired
    private ChecklistReportEntryRepository entryRepository;

    @Autowired
    private ChecklistSheetLayoutRepository layoutRepository;

    private static final DateTimeFormatter ISO_TIME = DateTimeFormatter.ofPattern("HH:mm");

    // ========== SAVE (batch) ==========

    /**
     * Persist a submitted checklist. The payload is a JSON array of row objects.
     * Returns the saved rows as DTO maps.
     */
    public List<Map<String, Object>> batchSave(List<Map<String, Object>> entries, User user) {
        if (entries == null || entries.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> saved = new ArrayList<>();
        for (Map<String, Object> e : entries) {
            ChecklistReportEntry entry = toEntry(e, user);
            ChecklistReportEntry persisted = entryRepository.save(entry);
            saved.add(toDto(persisted));
        }
        return saved;
    }

    /**
     * Persist a sheet layout (MASTER or CUSTOM) sent to the same
     * batch-save endpoint as a single object (not an array).
     */
    public ChecklistSheetLayout saveLayout(Map<String, Object> payload) {
        ChecklistSheetLayout layout = new ChecklistSheetLayout();
        layout.setKind(str(payload.get("kind")));
        layout.setSheetName(str(payload.get("sheetName")));
        layout.setColumnsJson(str(payload.get("columnsJson")));
        layout.setRowsJson(str(payload.get("rowsJson")));
        layout.setSiteName(str(payload.get("siteName")));
        layout.setReportDate(parseDate(str(payload.get("reportDate"))));
        return layoutRepository.save(layout);
    }

    private ChecklistReportEntry toEntry(Map<String, Object> e, User user) {
        ChecklistReportEntry entry = new ChecklistReportEntry();

        Object masterIdObj = e.get("checklistMasterId");
        if (masterIdObj != null) {
            try { entry.setChecklistMasterId(Long.valueOf(String.valueOf(masterIdObj))); }
            catch (NumberFormatException ignored) { entry.setChecklistMasterId(null); }
        }

        entry.setSheetName(str(e.get("sheetName")));
        entry.setSiteCode(str(e.get("siteCode")));
        entry.setSiteName(str(e.get("siteName")));
        entry.setShift(str(e.get("shift")));
        entry.setSectionName(str(e.get("sectionName")));
        entry.setFrequency(str(e.get("frequency")));
        entry.setTaskName(str(e.get("taskName")));
        entry.setStatus(str(e.get("status")));
        entry.setRemark(str(e.get("remark")));
        entry.setEmployeeName(str(e.get("employeeName")));
        entry.setCompletedBy(str(e.get("completedBy")));
        entry.setUpdatedBy(str(e.get("updatedBy")));
        entry.setTimeIn(parseTime(str(e.get("timeIn"))));
        entry.setTimeOut(parseTime(str(e.get("timeOut"))));
        entry.setReportDate(parseDate(str(e.get("reportDate"))));
        entry.setLatitude(parseDouble(e.get("latitude")));
        entry.setLongitude(parseDouble(e.get("longitude")));
        entry.setLocationAddress(str(e.get("locationAddress")));
        entry.setPhotoName(str(e.get("photoName")));
        entry.setPhotoPath(str(e.get("photoPath")));
        entry.setExtraJson(str(e.get("extraJson")));

        entry.setUser(user);

        return entry;
    }

    // ========== READ ==========

    /**
     * All submissions (Director "Updated Checklist"). Returns most-recent first.
     */
    public List<Map<String, Object>> getAllSubmissions() {
        List<ChecklistReportEntry> all = entryRepository.findAllByOrderByReportDateDescIdDesc();
        List<Map<String, Object>> out = new ArrayList<>();
        for (ChecklistReportEntry e : all) {
            out.add(toDto(e));
        }
        return out;
    }

    /**
     * Submissions for a specific site (supervisor/manager view).
     */
    public List<Map<String, Object>> getSubmissionsBySite(String siteCode) {
        if (siteCode == null || siteCode.isBlank()) {
            return Collections.emptyList();
        }
        List<ChecklistReportEntry> all = entryRepository.findByUserSiteCode(siteCode);
        List<Map<String, Object>> out = new ArrayList<>();
        for (ChecklistReportEntry e : all) {
            out.add(toDto(e));
        }
        return out;
    }

    /**
     * A single user's own submissions (Employee/Supervisor history).
     */
    public List<Map<String, Object>> getMySubmissions(Long userId) {
        List<ChecklistReportEntry> all = entryRepository.findByUserIdOrderByReportDateDescIdDesc(userId);
        return toDtoList(all);
    }

    /**
     * A single user's submissions within a date range.
     */
    public List<Map<String, Object>> getMySubmissionsByRange(Long userId, LocalDate from, LocalDate to) {
        List<ChecklistReportEntry> all = entryRepository.findByUserIdAndReportDateBetweenOrderByReportDateDescIdDesc(userId, from, to);
        return toDtoList(all);
    }

    /**
     * All submissions within a date range (Director reports).
     */
    public List<Map<String, Object>> getAllSubmissionsByRange(LocalDate from, LocalDate to) {
        List<ChecklistReportEntry> all = entryRepository.findAllByReportDateBetweenOrderByReportDateDescIdDesc(from, to);
        return toDtoList(all);
    }

    // ========== DELETE ==========

    public boolean deleteSubmission(Long id, Long userId) {
        return entryRepository.findById(id).map(existing -> {
            // Only allow deleting your own submissions.
            if (existing.getUser() != null && existing.getUser().getId().equals(userId)) {
                entryRepository.deleteById(id);
                return true;
            }
            return false;
        }).orElse(false);
    }

    // ========== PHOTO UPLOAD ==========

    public Map<String, Object> savePhoto(MultipartFile file) throws Exception {
        String uploadsDir = "uploads/checklist";
        Path uploadPath = Paths.get(uploadsDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalName = file.getOriginalFilename() == null ? "photo.jpg" : file.getOriginalFilename();
        String safeName = System.currentTimeMillis() + "_" + originalName.replaceAll("\\s+", "_");
        Path filePath = uploadPath.resolve(safeName);
        Files.copy(file.getInputStream(), filePath);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("photoName", safeName);
        result.put("photoPath", filePath.toString());
        return result;
    }

    // ========== HELPERS ==========

    private List<Map<String, Object>> toDtoList(List<ChecklistReportEntry> list) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ChecklistReportEntry e : list) {
            out.add(toDto(e));
        }
        return out;
    }

    private Map<String, Object> toDto(ChecklistReportEntry e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("checklistMasterId", e.getChecklistMasterId());
        m.put("sheetName", e.getSheetName());
        m.put("siteCode", e.getSiteCode());
        m.put("siteName", e.getSiteName());
        m.put("shift", e.getShift());
        m.put("sectionName", e.getSectionName());
        m.put("frequency", e.getFrequency());
        m.put("taskName", e.getTaskName());
        m.put("status", e.getStatus());
        m.put("remark", e.getRemark());
        m.put("employeeName", e.getEmployeeName());
        m.put("completedBy", e.getCompletedBy());
        m.put("updatedBy", e.getUpdatedBy());
        m.put("timeIn", e.getTimeIn() != null ? e.getTimeIn().toString() : null);
        m.put("timeOut", e.getTimeOut() != null ? e.getTimeOut().toString() : null);
        m.put("reportDate", e.getReportDate() != null ? e.getReportDate().toString() : null);
        m.put("latitude", e.getLatitude());
        m.put("longitude", e.getLongitude());
        m.put("locationAddress", e.getLocationAddress());
        m.put("photoName", e.getPhotoName());
        m.put("photoPath", e.getPhotoPath());
        m.put("extraJson", e.getExtraJson());

        if (e.getUser() != null) {
            Map<String, Object> sup = new LinkedHashMap<>();
            sup.put("id", e.getUser().getId());
            sup.put("name", e.getUser().getName());
            sup.put("employeeId", e.getUser().getEmployeeId());
            m.put("supervisor", sup);
        } else {
            m.put("supervisor", null);
        }
        return m;
    }

    private String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o);
        return s.isBlank() ? null : s;
    }

    private LocalTime parseTime(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            if (s.length() == 5) {
                return LocalTime.of(Integer.parseInt(s.substring(0, 2)), Integer.parseInt(s.substring(3, 5)));
            }
            return LocalTime.parse(s, ISO_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    private Double parseDouble(Object o) {
        if (o == null) return null;
        try {
            return Double.valueOf(String.valueOf(o));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
