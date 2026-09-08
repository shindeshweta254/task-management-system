package com.company.taskmanagement.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.service.FreeGeocodingService;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final FreeGeocodingService freeGeocodingService;

    public LocationController(FreeGeocodingService freeGeocodingService) {
        this.freeGeocodingService = freeGeocodingService;
    }

    @GetMapping("/reverse")
    public Map<String, String> reverseLocation(
            @RequestParam double latitude,
            @RequestParam double longitude) {

        String address =
                freeGeocodingService.reverseGeocode(latitude, longitude);

        return Map.of("address", address);
    }
}