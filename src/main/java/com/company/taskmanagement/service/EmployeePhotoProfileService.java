package com.company.taskmanagement.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.EmployeeFaceProfile;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.EmployeeFaceProfileRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class EmployeePhotoProfileService {

    @Autowired
    private EmployeeFaceProfileRepository employeeFaceProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccessService accessService;

    public EmployeeFaceProfile saveProfilePhoto(
            User supervisor,
            Long employeeId,
            String photoPath) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(supervisor, employee);

        EmployeeFaceProfile profile =
                employeeFaceProfileRepository
                        .findByUserId(employee.getId())
                        .orElseGet(EmployeeFaceProfile::new);

        profile.setUser(employee);
        profile.setReferencePhotoPath(photoPath);
        profile.setRegisteredByUserId(supervisor.getId());
        profile.setRegisteredAt(LocalDateTime.now());
        profile.setActive(true);

        return employeeFaceProfileRepository.save(profile);
    }

    public java.util.List<EmployeeFaceProfile> getRegisteredProfiles(
            User currentUser) {

        java.util.List<EmployeeFaceProfile> profiles =
                employeeFaceProfileRepository.findByActiveTrue();

        return profiles.stream()
                .filter(profile -> {
                    try {
                        accessService.validateTargetEmployee(
                                currentUser,
                                profile.getUser()
                        );
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .toList();
    }

    public void deleteProfile(
            User currentUser,
            Long employeeId) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(currentUser, employee);

        EmployeeFaceProfile profile =
                employeeFaceProfileRepository
                        .findByUserId(employeeId)
                        .orElseThrow(() ->
                                new RuntimeException("Registered photo not found"));

        // Employee account ko delete nahi karna.
        // Sirf registered face/profile ko deactivate karna hai.
        profile.setActive(false);

        employeeFaceProfileRepository.save(profile);
    }

    public EmployeeFaceProfile getProfile(
            User currentUser,
            Long employeeId) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        accessService.validateTargetEmployee(currentUser, employee);

        return employeeFaceProfileRepository
                .findByUserId(employee.getId())
                .orElse(null);
    }
}