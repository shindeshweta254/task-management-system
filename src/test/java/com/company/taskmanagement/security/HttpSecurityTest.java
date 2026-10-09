package com.company.taskmanagement.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.company.taskmanagement.controller.AuthController;
import com.company.taskmanagement.controller.UserController;
import com.company.taskmanagement.repository.RoleRepository;
import com.company.taskmanagement.repository.UserRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.OtpService;
import com.company.taskmanagement.service.UserService;

@WebMvcTest(controllers = {AuthController.class, UserController.class})
@AutoConfigureMockMvc
class HttpSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private UserService userService;

    @MockBean
    private OtpService otpService;

    @MockBean
    private AccessService accessService;

    @MockBean
    private RoleRepository roleRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void otpSendIsBlocked() throws Exception {
        mockMvc.perform(post("/api/auth/send-otp"))
                .andExpect(status().isForbidden());
    }

    @Test
    void otpVerifyIsBlocked() throws Exception {
        mockMvc.perform(post("/api/auth/verify-otp"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unsafePasswordResetIsBlocked() throws Exception {
        mockMvc.perform(post("/api/users/reset-password/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedUsersEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }
}