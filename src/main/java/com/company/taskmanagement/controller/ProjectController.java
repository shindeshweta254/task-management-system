package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.entity.Project;
import com.company.taskmanagement.entity.ProjectEmployee;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ProjectService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"})
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public List<Project> getAllProjects(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        List<Project> allProjects = projectService.getAllProjects();
        // Filter projects by user's site access
        return allProjects.stream()
                .filter(p -> {
                    String siteName = p.getSiteName();
                    if (siteName == null) return false;
                    return accessService.hasSiteAccess(currentUser, siteName);
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Project getProjectById(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        Project project = projectService.getProjectById(id);
        if (project.getSiteName() != null) {
            accessService.validateSiteAccess(currentUser, project.getSiteName());
        }
        return project;
    }

    @PostMapping("/import")
    public ResponseEntity<String> importFromExcel(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        accessService.resolveUser(request);
        String result = projectService.importFromExcel(file);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public Project updateProject(
            @PathVariable Long id,
            @RequestBody Project updated,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        Project project = projectService.getProjectById(id);
        if (project.getSiteName() != null) {
            accessService.validateSiteAccess(currentUser, project.getSiteName());
        }
        return projectService.updateProject(id, updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProject(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        Project project = projectService.getProjectById(id);
        if (project.getSiteName() != null) {
            accessService.validateSiteAccess(currentUser, project.getSiteName());
        }
        projectService.deleteProject(id);
        return ResponseEntity.ok("Project deleted");
    }

    @DeleteMapping("/employee/{empId}")
    public ResponseEntity<String> deleteEmployee(
            @PathVariable Long empId,
            HttpServletRequest request) {

        accessService.resolveUser(request);
        // Employee deletion requires verifying the parent project's site
        projectService.deleteEmployee(empId);
        return ResponseEntity.ok("Employee deleted");
    }

    @PutMapping("/employee/{empId}")
    public ProjectEmployee updateEmployee(
            @PathVariable Long empId,
            @RequestBody ProjectEmployee updated,
            HttpServletRequest request) {

        accessService.resolveUser(request);
        return projectService.updateEmployee(empId, updated);
    }
}
