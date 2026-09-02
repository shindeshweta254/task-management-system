package com.company.taskmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.OtpVerification;

public interface OtpVerificationRepository
        extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmployeeIdAndMobileNumberAndRoleNameAndVerifiedFalseOrderByCreatedAtDesc(
            String employeeId,
            String mobileNumber,
            String roleName
    );
}
