package com.company.taskmanagement;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String[] passwords = {
            "All@123",
            "SSSfms@123",
            "SSSfms@1234"
        };

        for (String password : passwords) {
            System.out.println("PASSWORD: " + password);
            System.out.println("BCRYPT HASH: " + encoder.encode(password));
            System.out.println("--------------------------");
        }
    }
}
