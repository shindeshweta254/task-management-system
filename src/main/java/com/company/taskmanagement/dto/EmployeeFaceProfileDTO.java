package com.company.taskmanagement.dto;

import java.time.LocalDateTime;

import com.company.taskmanagement.entity.EmployeeFaceProfile;

public class EmployeeFaceProfileDTO {

    private Long id;
    private UserDTO user;
    private String referencePhotoPath;
    private Long registeredByUserId;
    private LocalDateTime registeredAt;
    private Boolean active;

    public static EmployeeFaceProfileDTO fromEntity(EmployeeFaceProfile profile) {
        if (profile == null) {
            return null;
        }

        EmployeeFaceProfileDTO dto = new EmployeeFaceProfileDTO();
        dto.setId(profile.getId());
        dto.setUser(UserDTO.fromUser(profile.getUser()));
        dto.setReferencePhotoPath(profile.getReferencePhotoPath());
        dto.setRegisteredByUserId(profile.getRegisteredByUserId());
        dto.setRegisteredAt(profile.getRegisteredAt());
        dto.setActive(profile.getActive());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public String getReferencePhotoPath() {
        return referencePhotoPath;
    }

    public void setReferencePhotoPath(String referencePhotoPath) {
        this.referencePhotoPath = referencePhotoPath;
    }

    public Long getRegisteredByUserId() {
        return registeredByUserId;
    }

    public void setRegisteredByUserId(Long registeredByUserId) {
        this.registeredByUserId = registeredByUserId;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}