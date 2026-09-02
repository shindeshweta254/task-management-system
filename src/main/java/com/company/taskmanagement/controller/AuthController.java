package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.JwtResponse;
import com.company.taskmanagement.dto.LoginRequest;
import com.company.taskmanagement.dto.SendOtpRequest;
import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.dto.VerifyOtpRequest;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.security.JwtUtil;
import com.company.taskmanagement.service.OtpService;
import com.company.taskmanagement.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "https://sss-fms-india-90a76.firebaseapp.com",
        "https://sss-fms-india-90a76.web.app"
})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpService otpService;


    // =========================================================
    // OLD LOGIN
    // =========================================================

    @PostMapping("/login")
    public JwtResponse login(
            @RequestBody LoginRequest loginRequest) {

        UserDTO user = userService.login(
                loginRequest.getEmployeeId(),
                loginRequest.getEmail(),
                loginRequest.getPassword()
        );

        String token = jwtUtil.generateToken(
                user.getEmployeeId()
        );

        return new JwtResponse(
                token,
                "Bearer",
                user
        );
    }


    // =========================================================
    // SEND OTP
    // =========================================================

    @PostMapping("/send-otp")
    public String sendOtp(
            @RequestBody SendOtpRequest request) {

        return otpService.sendOtp(
                request.getEmployeeId(),
                request.getRoleName(),
                request.getMobileNumber()
        );
    }


    // =========================================================
    // VERIFY OTP
    // =========================================================

    @PostMapping("/verify-otp")
    public JwtResponse verifyOtp(
            @RequestBody VerifyOtpRequest request) {

        User user = otpService.verifyOtp(
                request.getEmployeeId(),
                request.getRoleName(),
                request.getMobileNumber(),
                request.getOtp()
        );

        UserDTO userDTO =
                UserDTO.fromUser(user);

        String token =
                jwtUtil.generateToken(
                        user.getEmployeeId()
                );

        return new JwtResponse(
                token,
                "Bearer",
                userDTO
        );
    }


    // =========================================================
    // CURRENT USER
    // =========================================================

    @GetMapping("/me")
    public UserDTO getCurrentUser(
            org.springframework.security.core.Authentication authentication) {

        String employeeId =
                authentication.getName();

        User user =
                userService.findUserByEmployeeId(
                        employeeId
                );

        if (user == null) {
            throw new RuntimeException(
                    "User not found"
            );
        }

        return UserDTO.fromUser(user);
    }
}
