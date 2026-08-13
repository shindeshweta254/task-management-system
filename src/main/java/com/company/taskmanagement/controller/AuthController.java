package com.company.taskmanagement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.JwtResponse;
import com.company.taskmanagement.dto.LoginRequest;
import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.security.JwtUtil;
import com.company.taskmanagement.service.UserService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
	    "http://localhost:5173",
	    "http://localhost:5174",
	    "http://localhost:5175",
	    "http://localhost:5176",
	    "http://localhost:5177"
	})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest loginRequest) {

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
}