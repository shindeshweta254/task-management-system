package com.company.taskmanagement.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.ChecklistSheetLayout;
import com.company.taskmanagement.repository.ChecklistSheetLayoutRepository;
import com.company.taskmanagement.service.AccessService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/checklist-sheet")
public class ChecklistSheetController {

    @Autowired
    private AccessService accessService;

    @Autowired
    private ChecklistSheetLayoutRepository layoutRepository;

    /**
     * GET /api/checklist-sheet/master?sheetName=...&date=...
     *
     * Returns the saved master column layout for a checklist sheet.
     * When no saved layout exists it still returns HTTP 200 so the UI falls
     * back to its default columns.
     */
    @GetMapping("/master")
    public Map<String, Object> getMasterLayout(
            @RequestParam(value = "sheetName", required = false) String sheetName,
            @RequestParam(value = "date", required = false) String date,
            HttpServletRequest request) {
        accessService.resolveUser(request);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("found", false);
        response.put("columnsJson", "");
        response.put("sheetName", sheetName);
        response.put("date", date);

        if (sheetName != null && !sheetName.isBlank()) {
            layoutRepository.findTopBySheetNameOrderByIdDesc(sheetName).ifPresent(layout -> {
                response.put("found", true);
                response.put("columnsJson", layout.getColumnsJson() == null ? "" : layout.getColumnsJson());
                response.put("rowsJson", layout.getRowsJson() == null ? "" : layout.getRowsJson());
                response.put("kind", layout.getKind());
            });
        }

        return response;
    }

    /**
     * POST /api/checklist-sheet/save
     *
     * Persists a custom/MASTER checklist sheet layout (used by NewChecklist.jsx
     * and the column builder). Body: { kind, sheetName, columnsJson, rowsJson,
     * siteName, reportDate }.
     */
    @PostMapping("/save")
    public Map<String, Object> saveLayout(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        accessService.resolveUser(request);

        ChecklistSheetLayout layout = new ChecklistSheetLayout();
        layout.setKind(payload.get("kind") == null ? null : String.valueOf(payload.get("kind")));
        layout.setSheetName(payload.get("sheetName") == null ? null : String.valueOf(payload.get("sheetName")));
        layout.setColumnsJson(payload.get("columnsJson") == null ? null : String.valueOf(payload.get("columnsJson")));
        layout.setRowsJson(payload.get("rowsJson") == null ? null : String.valueOf(payload.get("rowsJson")));
        layout.setSiteName(payload.get("siteName") == null ? null : String.valueOf(payload.get("siteName")));
        if (payload.get("reportDate") != null) {
            try {
                layout.setReportDate(java.time.LocalDate.parse(String.valueOf(payload.get("reportDate"))));
            } catch (Exception e) {
                layout.setReportDate(null);
            }
        }

        ChecklistSheetLayout saved = layoutRepository.save(layout);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("id", saved.getId());
        return response;
    }
}
