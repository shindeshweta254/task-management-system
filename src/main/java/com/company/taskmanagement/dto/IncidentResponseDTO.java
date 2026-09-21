package com.company.taskmanagement.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.company.taskmanagement.entity.Incident;

public class IncidentResponseDTO {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String siteCode;
    private LocalDate incidentDate;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String resolutionNotes;
    private IncidentUserDTO reportedBy;
    private IncidentUserDTO assignedTo;

    public static IncidentResponseDTO fromIncident(Incident incident) {

        IncidentResponseDTO dto = new IncidentResponseDTO();

        dto.id = incident.getId();
        dto.title = incident.getTitle();
        dto.description = incident.getDescription();
        dto.category = incident.getCategory();
        dto.priority = incident.getPriority();
        dto.status = incident.getStatus();
        dto.siteCode = incident.getSiteCode();
        dto.incidentDate = incident.getIncidentDate();
        dto.createdAt = incident.getCreatedAt();
        dto.resolvedAt = incident.getResolvedAt();
        dto.resolutionNotes = incident.getResolutionNotes();
        dto.reportedBy = IncidentUserDTO.fromUser(
                incident.getReportedBy());
        dto.assignedTo = IncidentUserDTO.fromUser(
                incident.getAssignedTo());

        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public String getSiteCode() {
        return siteCode;
    }

    public LocalDate getIncidentDate() {
        return incidentDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public IncidentUserDTO getReportedBy() {
        return reportedBy;
    }

    public IncidentUserDTO getAssignedTo() {
        return assignedTo;
    }
}