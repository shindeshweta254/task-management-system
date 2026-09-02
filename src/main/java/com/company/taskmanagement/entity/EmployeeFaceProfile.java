package com.company.taskmanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "employee_face_profile")
public class EmployeeFaceProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "reference_photo_path")
    private String referencePhotoPath;

    @Column(name = "registered_by_user_id")
    private Long registeredByUserId;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    private Boolean active = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
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
