package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.IncidentResponseDTO;
import com.company.taskmanagement.entity.Incident;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.IncidentService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public ResponseEntity<List<IncidentResponseDTO>> getIncidents(
            HttpServletRequest request) {

        User currentUser =
                accessService.resolveUser(request);

        List<IncidentResponseDTO> response =
                incidentService
                        .getAccessibleIncidents(currentUser)
                        .stream()
                        .map(IncidentResponseDTO::fromIncident)
                        .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponseDTO> getIncident(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser =
                accessService.resolveUser(request);

        Incident incident =
                incidentService.getAccessibleIncident(
                        id,
                        currentUser);

        return ResponseEntity.ok(
                IncidentResponseDTO.fromIncident(incident));
    }

    @PostMapping
    public ResponseEntity<IncidentResponseDTO> createIncident(
            @RequestBody Incident incident,
            HttpServletRequest request) {

        User currentUser =
                accessService.resolveUser(request);

        Incident saved =
                incidentService.createIncident(
                        incident,
                        currentUser);

        return ResponseEntity.ok(
                IncidentResponseDTO.fromIncident(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentResponseDTO> updateIncident(
            @PathVariable Long id,
            @RequestBody Incident incident,
            HttpServletRequest request) {

        User currentUser =
                accessService.resolveUser(request);

        validateManagePermission(currentUser);

        Incident updated =
                incidentService.updateIncident(
                        id,
                        incident,
                        currentUser);

        return ResponseEntity.ok(
                IncidentResponseDTO.fromIncident(updated));
    }

    private void validateManagePermission(
            User currentUser) {

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)
                || accessService.isSupervisor(currentUser)
                || accessService.isManager(currentUser)) {
            return;
        }

        throw new ForbiddenException(
                "You do not have permission to manage incidents");
    }
}