package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.entity.ChecklistMaster;
import com.company.taskmanagement.service.ChecklistMasterService;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/checklist-master")
public class ChecklistMasterController {

    @Autowired
    private ChecklistMasterService checklistMasterService;

    @PostMapping("/import")
    public String importChecklist(@RequestParam("file") MultipartFile file) {
        return checklistMasterService.importChecklistExcel(file);
    }

    @GetMapping
    public List<ChecklistMaster> getAllChecklist() {
        return checklistMasterService.getAllChecklist();
    }

    @GetMapping("/sheet")
    public List<ChecklistMaster> getChecklistBySheet(
            @RequestParam String sheetName) {

        return checklistMasterService.getChecklistBySheet(sheetName);
    }

}