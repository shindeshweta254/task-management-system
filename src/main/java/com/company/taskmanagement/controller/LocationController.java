package com.company.taskmanagement.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.service.GoogleGeocodingService;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final GoogleGeocodingService googleGeocodingService;

    public LocationController(GoogleGeocodingService googleGeocodingService) {
        this.googleGeocodingService = googleGeocodingService;
    }

    @GetMapping("/reverse")
    public ResponseEntity<Map<String, String>> reverseGeocode(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String address =
                googleGeocodingService.reverseGeocode(latitude, longitude);

        return ResponseEntity.ok(
                Map.of("address", address)
        );
    }
}
