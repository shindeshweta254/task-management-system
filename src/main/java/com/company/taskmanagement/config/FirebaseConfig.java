package com.company.taskmanagement.config;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws Exception {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        String base64 = System.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64");

        if (base64 == null || base64.isBlank()) {
            throw new IllegalStateException(
                    "FIREBASE_SERVICE_ACCOUNT_BASE64 is not configured");
        }

        byte[] decoded = Base64.getDecoder().decode(base64);
        String json = new String(decoded, StandardCharsets.UTF_8);

        GoogleCredentials credentials = GoogleCredentials.fromStream(
                new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))
        );

        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

        return FirebaseApp.initializeApp(options);
    }
}
