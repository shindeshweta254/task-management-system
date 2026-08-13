package com.company.taskmanagement;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

        String hash = encoder.encode("sss@123");

        System.out.println("================================");
        System.out.println(hash);
        System.out.println("================================");
    }
}