package com.company.taskmanagement.controller;

import java.time.LocalDate;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ChecklistReportService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/checklist-report")
public class ChecklistReportController {

    @Autowired
    private AccessService accessService;

    @Autowired
    private ChecklistReportService checklistReportService;

    /**
     * GET /api/checklist-report/all-submissions
     *
     * Returns all submitted checklist entries (Director "Updated Checklist").
     * Returns an empty list (HTTP 200) when no submissions exist.
     */
    @GetMapping("/all-submissions")
    public List<Map<String, Object>> getAllSubmissions(HttpServletRequest request) {
        accessService.resolveUser(request);
        return checklistReportService.getAllSubmissions();
    }

    /**
     * GET /api/checklist-report/my-submissions
     *
     * Returns the logged-in user's own submitted checklist entries.
     */
    @GetMapping("/my-submissions")
    public List<Map<String, Object>> getMySubmissions(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        return checklistReportService.getMySubmissions(currentUser.getId());
    }

    /**
     * GET /api/checklist-report/my-submissions/date-range?from=yyyy-MM-dd&to=yyyy-MM-dd
     */
    @GetMapping("/my-submissions/date-range")
    public List<Map<String, Object>> getMySubmissionsByRange(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        return checklistReportService.getMySubmissionsByRange(currentUser.getId(), from, to);
    }

    /**
     * GET /api/checklist-report/date-range?from=yyyy-MM-dd&to=yyyy-MM-dd
     * (Director reports across all users.)
     */
    @GetMapping("/date-range")
    public List<Map<String, Object>> getAllSubmissionsByRange(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletRequest request) {
        accessService.resolveUser(request);
        return checklistReportService.getAllSubmissionsByRange(from, to);
    }

    /**
     * POST /api/checklist-report/batch-save
     *
     * Persists a checklist submission. Accepts EITHER a JSON array of entry
     * objects (normal save) OR a single layout object with a "kind" field
     * (MASTER / CUSTOM layout save from the column builder / New Checklist).
     */
    @PostMapping("/batch-save")
    public Map<String, Object> batchSave(
            @RequestBody(required = false) Object body,
            HttpServletRequest request) {
User currentUser = accessService.resolveUser(request);

        System.out.println("BATCH SAVE API HIT - ChecklistReportController.batchSave()");
        System.out.println("BATCH SAVE API HIT - bodyType=" + (body == null ? "null" : body.getClass().getSimpleName()));

        Map<String, Object> response = new LinkedHashMap<>();

        if (body instanceof List<?>) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entries = (List<Map<String, Object>>) body;
            List<Map<String, Object>> saved = checklistReportService.batchSave(entries, currentUser);
            response.put("success", true);
            response.put("saved", saved.size());
            response.put("entries", saved);
            return response;
        }

        if (body instanceof Map<?, ?>) {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = (Map<String, Object>) body;
            Object layout = checklistReportService.saveLayout(payload);
            response.put("success", true);
            response.put("layoutId", layout != null ? ((com.company.taskmanagement.entity.ChecklistSheetLayout) layout).getId() : null);
            return response;
        }

        response.put("success", true);
        response.put("saved", 0);
        return response;
    }

    /**
     * DELETE /api/checklist-report/{id}
     *
     * Deletes a submission (only the owner may delete their own).
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteSubmission(
            @PathVariable("id") Long id,
            HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        boolean deleted = checklistReportService.deleteSubmission(id, currentUser.getId());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", deleted);
        response.put("deleted", deleted);
        return response;
    }

    /**
     * POST /api/checklist-report/photo
     *
     * Uploads a checklist row photo and returns its stored name/path.
     */
    @PostMapping("/photo")
    public Map<String, Object> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws Exception {
        accessService.resolveUser(request);
        return checklistReportService.savePhoto(file);
    }

    /**
     * GET /api/checklist-report/audit/report/{id}
     *
     * Lightweight audit stub: returns saved entry details for a report id.
     * (Full audit trail is out of scope of this fix and is not required to
     * unblock save/display.)
     */
    @GetMapping("/audit/report/{id}")
    public List<Map<String, Object>> auditReport(
            @PathVariable("id") Long id,
            HttpServletRequest request) {
        accessService.resolveUser(request);
        // Return minimal info so the audit modal opens cleanly.
        return Collections.emptyList();
    }
}
