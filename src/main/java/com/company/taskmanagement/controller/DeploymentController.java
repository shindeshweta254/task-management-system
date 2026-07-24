package com.company.taskmanagement.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Project;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ProjectService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/deployment")
public class DeploymentController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AccessService accessService;

    @GetMapping("/my-site")
    public List<Project> getMySiteDeployment(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        List<Project> allProjects = projectService.getAllProjects();
        // Filter by user's site access
        return allProjects.stream()
                .filter(p -> {
                    String siteName = p.getSiteName();
                    if (siteName == null) return false;
                    return accessService.hasSiteAccess(currentUser, siteName);
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/summary")
    public Map<String, Long> getDeploymentSummary(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        List<Project> allProjects = projectService.getAllProjects();
        
        // Filter accessible projects
        List<Project> accessibleProjects = allProjects.stream()
                .filter(p -> {
                    String siteName = p.getSiteName();
                    if (siteName == null) return false;
                    return accessService.hasSiteAccess(currentUser, siteName);
                })
                .collect(Collectors.toList());

        long totalSites = accessibleProjects.size();
        long totalDeployedEmployees = accessibleProjects.stream()
                .mapToLong(p -> p.getEmployees() != null ? p.getEmployees().size() : 0)
                .sum();

        return Map.of(
            "totalSites", totalSites,
            "totalDeployedEmployees", totalDeployedEmployees
        );
    }

    @GetMapping("/chart-data")
    public List<Map<String, Object>> getDeploymentChartData(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        List<Project> allProjects = projectService.getAllProjects();
        
        // Filter accessible projects and return site-wise employee counts as JSON
        return allProjects.stream()
                .filter(p -> {
                    String siteName = p.getSiteName();
                    if (siteName == null) return false;
                    return accessService.hasSiteAccess(currentUser, siteName);
                })
                .map(p -> {
                    int empCount = p.getEmployees() != null ? p.getEmployees().size() : 0;
                    return Map.<String, Object>of(
                        "siteName", p.getSiteName() != null ? p.getSiteName() : "Unknown",
                        "sheetName", p.getSheetName() != null ? p.getSheetName() : "",
                        "employees", empCount
                    );
                })
                .collect(Collectors.toList());
    }
}

