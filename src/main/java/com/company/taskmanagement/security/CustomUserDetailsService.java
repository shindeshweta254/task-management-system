package com.company.taskmanagement.security;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        if (username == null || username.trim().isEmpty()) {
            throw new UsernameNotFoundException("Employee ID is required");
        }

        List<User> users =
                userRepository.findByEmployeeId(username.trim());

        if (users == null || users.isEmpty()) {
            throw new UsernameNotFoundException(
                    "User not found with employeeId: " + username
            );
        }

        User user = users.get(0);

        String role = "USER";

        if (user.getRole() != null
                && user.getRole().getRoleName() != null
                && !user.getRole().getRoleName().trim().isEmpty()) {

            role = user.getRole()
                    .getRoleName()
                    .trim()
                    .toUpperCase();
        }

        String password = user.getPassword() != null
                ? user.getPassword()
                : "";

        return new org.springframework.security.core.userdetails.User(
                user.getEmployeeId(),
                password,
                "ACTIVE".equalsIgnoreCase(user.getStatus()),
                true,
                true,
                true,
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + role)
                )
        );
    }
}