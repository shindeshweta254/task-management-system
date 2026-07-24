package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.entity.ChecklistMaster;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ChecklistMasterService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/checklist-master")
public class ChecklistMasterController {

    @Autowired
    private ChecklistMasterService checklistMasterService;

    @Autowired
    private AccessService accessService;

    @PostMapping("/import")
    public String importChecklist(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        accessService.resolveUser(request);
        return checklistMasterService.importChecklistExcel(file);
    }

    @GetMapping
    public List<ChecklistMaster> getAllChecklist(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        List<ChecklistMaster> allChecklist = checklistMasterService.getAllChecklist();
        // Filter by user's site access
        return allChecklist.stream()
                .filter(c -> {
                    String siteName = c.getSiteName();
                    if (siteName == null) return false;
                    return accessService.hasSiteAccess(currentUser, siteName);
                })
                .collect(Collectors.toList());
    }

	@GetMapping("/sheet")
	public List<ChecklistMaster> getChecklistBySheet(
			@RequestParam String sheetName,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		List<ChecklistMaster> results = checklistMasterService.getChecklistBySheet(sheetName);
		// Filter by site access
		return results.stream()
				.filter(c -> {
					String siteName = c.getSiteName();
					if (siteName == null) return false;
					return accessService.hasSiteAccess(currentUser, siteName);
				})
				.collect(Collectors.toList());
	}

	@GetMapping("/my-checklists")
	public List<ChecklistMaster> getMyChecklists(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<ChecklistMaster> allChecklist = checklistMasterService.getAllChecklist();
		// Filter by user's site access
		return allChecklist.stream()
				.filter(c -> {
					String siteName = c.getSiteName();
					if (siteName == null) return false;
					return accessService.hasSiteAccess(currentUser, siteName);
				})
				.collect(Collectors.toList());
	}

	@GetMapping("/my-site")
	public List<ChecklistMaster> getMySiteChecklists(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<ChecklistMaster> allChecklist = checklistMasterService.getAllChecklist();
		// Filter by user's site access
		return allChecklist.stream()
				.filter(c -> {
					String siteName = c.getSiteName();
					if (siteName == null) return false;
					return accessService.hasSiteAccess(currentUser, siteName);
				})
				.collect(Collectors.toList());
	}

}
