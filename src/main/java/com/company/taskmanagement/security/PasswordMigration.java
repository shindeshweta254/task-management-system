package com.company.taskmanagement.security;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.UserRepository;

@Component
public class PasswordMigration implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordMigration(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        int converted = 0;
        int skipped = 0;

        for (User user : userRepository.findAll()) {

            String password = user.getPassword();

            if (password == null || password.trim().isEmpty()) {
                skipped++;
                continue;
            }

            password = password.trim();

            // Already BCrypt -> don't change it
            if (password.startsWith("$2a$")
                    || password.startsWith("$2b$")
                    || password.startsWith("$2y$")) {

                skipped++;
                continue;
            }

            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);

            converted++;
        }

        System.out.println("==========================================");
        System.out.println("PASSWORD MIGRATION COMPLETED");
        System.out.println("Converted: " + converted);
        System.out.println("Skipped: " + skipped);
        System.out.println("==========================================");
    }
}