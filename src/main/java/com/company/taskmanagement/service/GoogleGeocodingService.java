package com.company.taskmanagement.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GoogleGeocodingService {

    @Value("${google.maps.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public String reverseGeocode(double latitude, double longitude) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Google Maps API key is not configured");
        }

        String url = UriComponentsBuilder
                .fromHttpUrl("https://maps.googleapis.com/maps/api/geocode/json")
                .queryParam("latlng", latitude + "," + longitude)
                .queryParam("key", apiKey)
                .toUriString();

        Map<String, Object> response =
                restTemplate.getForObject(url, Map.class);

        if (response == null) {
            return "Current Location";
        }

        Object resultsObject = response.get("results");

        if (!(resultsObject instanceof List<?> results)
                || results.isEmpty()) {
            return "Current Location";
        }

        Object firstObject = results.get(0);

        if (!(firstObject instanceof Map<?, ?> firstResult)) {
            return "Current Location";
        }

        Object formattedAddress =
                firstResult.get("formatted_address");

        if (formattedAddress == null) {
            return "Current Location";
        }

        return String.valueOf(formattedAddress);
    }
}