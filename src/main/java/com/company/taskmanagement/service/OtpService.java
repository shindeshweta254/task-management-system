package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.OtpVerification;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.OtpVerificationRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class OtpService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpVerificationRepository otpRepository;

    private final Random random = new Random();

    public String sendOtp(
            String employeeId,
            String roleName,
            String mobileNumber) {

        if (employeeId == null || employeeId.trim().isEmpty()) {
            throw new RuntimeException("Employee ID is required");
        }

        if (roleName == null || roleName.trim().isEmpty()) {
            throw new RuntimeException("Role is required");
        }

        if (mobileNumber == null || mobileNumber.trim().isEmpty()) {
            throw new RuntimeException("Mobile number is required");
        }

        employeeId = employeeId.trim();
        roleName = roleName.trim().toUpperCase();
        mobileNumber = cleanMobileNumber(mobileNumber);

        User user = findUser(employeeId);

        if (user == null) {
            throw new RuntimeException("Employee ID not found");
        }

        if (user.getStatus() != null
                && !"ACTIVE".equalsIgnoreCase(user.getStatus().trim())) {

            throw new RuntimeException(
                    "Your account is not active. Please contact Administrator."
            );
        }

        if (user.getRole() == null) {
            throw new RuntimeException("Employee role is not assigned");
        }

        String databaseRole =
                user.getRole().getRoleName().trim().toUpperCase();

        if (!databaseRole.equals(roleName)) {
            throw new RuntimeException(
                    "Selected role does not match your account role."
            );
        }

        String databaseMobile =
                cleanMobileNumber(user.getContactNo());

        if (databaseMobile.isEmpty()) {
            throw new RuntimeException(
                    "Mobile number is not registered for this employee."
            );
        }

        if (!databaseMobile.equals(mobileNumber)) {
            throw new RuntimeException(
                    "Mobile number does not match our records."
            );
        }

        String otp = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        OtpVerification verification = new OtpVerification();

        verification.setEmployeeId(employeeId);
        verification.setMobileNumber(mobileNumber);
        verification.setRoleName(roleName);
        verification.setOtp(otp);
        verification.setCreatedAt(LocalDateTime.now());
        verification.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );
        verification.setVerified(false);

        otpRepository.save(verification);

        System.out.println("========================================");
        System.out.println("OTP GENERATED");
        System.out.println("Employee ID : " + employeeId);
        System.out.println("Mobile      : " + mobileNumber);
        System.out.println("Role        : " + roleName);
        System.out.println("OTP         : " + otp);
        System.out.println("Expires     : " + verification.getExpiresAt());
        System.out.println("========================================");

        return otp;
    }

    public User verifyOtp(
            String employeeId,
            String roleName,
            String mobileNumber,
            String otp) {

        if (employeeId == null || employeeId.trim().isEmpty()) {
            throw new RuntimeException("Employee ID is required");
        }

        if (roleName == null || roleName.trim().isEmpty()) {
            throw new RuntimeException("Role is required");
        }

        if (mobileNumber == null || mobileNumber.trim().isEmpty()) {
            throw new RuntimeException("Mobile number is required");
        }

        if (otp == null || otp.trim().isEmpty()) {
            throw new RuntimeException("OTP is required");
        }

        employeeId = employeeId.trim();
        roleName = roleName.trim().toUpperCase();
        mobileNumber = cleanMobileNumber(mobileNumber);
        otp = otp.trim();

        OtpVerification verification =
                otpRepository
                        .findTopByEmployeeIdAndMobileNumberAndRoleNameAndVerifiedFalseOrderByCreatedAtDesc(
                                employeeId,
                                mobileNumber,
                                roleName
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "OTP not found. Please request a new OTP."
                                )
                        );

        if (LocalDateTime.now()
                .isAfter(verification.getExpiresAt())) {

            throw new RuntimeException(
                    "OTP has expired. Please request a new OTP."
            );
        }

        if (!verification.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        verification.setVerified(true);
        otpRepository.save(verification);

        User user = findUser(employeeId);

        if (user == null) {
            throw new RuntimeException("Employee not found");
        }

        if (user.getStatus() != null
                && !"ACTIVE".equalsIgnoreCase(user.getStatus().trim())) {

            throw new RuntimeException(
                    "Your account is not active."
            );
        }

        System.out.println(
                "OTP VERIFICATION SUCCESS: " + employeeId
        );

        return user;
    }

    private User findUser(String employeeId) {

        var users =
                userRepository.findByEmployeeId(employeeId);

        if (users == null || users.isEmpty()) {
            return null;
        }

        return users.get(0);
    }

    private String cleanMobileNumber(String mobile) {

        if (mobile == null) {
            return "";
        }

        return mobile
                .trim()
                .replaceAll("\\s+", "")
                .replace("-", "")
                .replace("+91", "");
    }
}
