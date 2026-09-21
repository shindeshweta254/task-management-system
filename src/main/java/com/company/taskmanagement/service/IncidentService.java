package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Incident;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import com.company.taskmanagement.repository.IncidentRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class IncidentService {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessService accessService;

    public List<Incident> getAccessibleIncidents(User currentUser) {

        List<Incident> all =
                incidentRepository.findAllByOrderByCreatedAtDesc();

        if (hasGlobalAccess(currentUser)) {
            return all;
        }

        if (accessService.isEmployee(currentUser)) {
            return all.stream()
                    .filter(incident ->
                            incident.getReportedBy() != null
                            && incident.getReportedBy().getId()
                                    .equals(currentUser.getId()))
                    .collect(Collectors.toList());
        }

        Set<String> permittedSites =
                accessService.getPermittedSites(currentUser);

        if (permittedSites.contains("ALL")) {
            return all;
        }

        return all.stream()
                .filter(incident ->
                        incident.getSiteCode() != null
                        && permittedSites.contains(
                                incident.getSiteCode()
                                        .trim()
                                        .toUpperCase()))
                .collect(Collectors.toList());
    }

    public Incident getAccessibleIncident(
            Long id,
            User currentUser) {

        Incident incident = getById(id);
        validateIncidentAccess(currentUser, incident);
        return incident;
    }

    public Incident createIncident(
            Incident incident,
            User currentUser) {

        if (incident.getTitle() == null
                || incident.getTitle().isBlank()) {
            throw new IllegalArgumentException(
                    "Title is required");
        }

        if (incident.getCategory() == null
                || incident.getCategory().isBlank()) {
            incident.setCategory("INCIDENT");
        }

        String category =
                incident.getCategory().trim().toUpperCase();

        if (!"INCIDENT".equals(category)
                && !"COMPLAINT".equals(category)) {
            throw new IllegalArgumentException(
                    "Category must be INCIDENT or COMPLAINT");
        }

        incident.setCategory(category);

        if (incident.getPriority() == null
                || incident.getPriority().isBlank()) {
            incident.setPriority("MEDIUM");
        } else {
            incident.setPriority(
                    incident.getPriority().trim().toUpperCase());
        }

        incident.setStatus("OPEN");

        if (incident.getIncidentDate() == null) {
            incident.setIncidentDate(LocalDate.now());
        }

        String siteCode = normalize(incident.getSiteCode());

        if (siteCode == null) {
            siteCode = firstUserSite(currentUser);
        }

        if (siteCode == null) {
            throw new IllegalArgumentException(
                    "Site code is required");
        }

        if (!hasGlobalAccess(currentUser)
                && !accessService.hasSiteAccess(
                        currentUser,
                        siteCode)) {
            throw new ForbiddenException(
                    "Access denied to site: " + siteCode);
        }

        incident.setSiteCode(siteCode);
        incident.setReportedBy(currentUser);
        incident.setCreatedAt(LocalDateTime.now());
        incident.setResolvedAt(null);
        incident.setResolutionNotes(null);

        if (incident.getAssignedTo() != null
                && incident.getAssignedTo().getId() != null) {

            User assignedUser = userRepository
                    .findById(incident.getAssignedTo().getId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Assigned user not found"));

            accessService.validateTargetEmployee(
                    currentUser,
                    assignedUser);

            incident.setAssignedTo(assignedUser);
        } else {
            incident.setAssignedTo(null);
        }

        return incidentRepository.save(incident);
    }

    public Incident updateIncident(
            Long id,
            Incident updated,
            User currentUser) {

        Incident existing =
                getAccessibleIncident(id, currentUser);

        if (accessService.isEmployee(currentUser)) {
            throw new ForbiddenException(
                    "Employees cannot manage incidents");
        }

        if (updated.getPriority() != null
                && !updated.getPriority().isBlank()) {
            existing.setPriority(
                    updated.getPriority().trim().toUpperCase());
        }

        if (updated.getStatus() != null
                && !updated.getStatus().isBlank()) {

            String status =
                    updated.getStatus().trim().toUpperCase();

            if (!"OPEN".equals(status)
                    && !"IN_PROGRESS".equals(status)
                    && !"RESOLVED".equals(status)
                    && !"CLOSED".equals(status)) {
                throw new IllegalArgumentException(
                        "Invalid incident status");
            }

            existing.setStatus(status);

            if ("RESOLVED".equals(status)
                    || "CLOSED".equals(status)) {
                existing.setResolvedAt(LocalDateTime.now());
            } else {
                existing.setResolvedAt(null);
            }
        }

        if (updated.getResolutionNotes() != null) {
            existing.setResolutionNotes(
                    updated.getResolutionNotes());
        }

        if (updated.getAssignedTo() != null
                && updated.getAssignedTo().getId() != null) {

            User assignedUser = userRepository
                    .findById(updated.getAssignedTo().getId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Assigned user not found"));

            accessService.validateTargetEmployee(
                    currentUser,
                    assignedUser);

            existing.setAssignedTo(assignedUser);
        }

        return incidentRepository.save(existing);
    }

    private Incident getById(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Incident not found"));
    }

    private void validateIncidentAccess(
            User currentUser,
            Incident incident) {

        if (hasGlobalAccess(currentUser)) {
            return;
        }

        if (incident.getReportedBy() != null
                && incident.getReportedBy().getId()
                        .equals(currentUser.getId())) {
            return;
        }

        if (incident.getSiteCode() != null
                && accessService.hasSiteAccess(
                        currentUser,
                        incident.getSiteCode())) {
            return;
        }

        throw new ForbiddenException(
                "Access denied to incident: "
                        + incident.getId());
    }

    private boolean hasGlobalAccess(User user) {
        return accessService.hasElevatedAccess(user)
                || accessService.isGlobalSupervisor(user)
                || accessService.isSP002(user);
    }

    private String firstUserSite(User user) {

        Set<String> sites =
                accessService.getPermittedSites(user);

        return sites.stream()
                .filter(site -> !"ALL".equalsIgnoreCase(site))
                .findFirst()
                .orElse(null);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}