package com.company.taskmanagement.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GoogleGeocodingService {

    @Value("${mappls.static-key:}")
    private String mapplsStaticKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public String reverseGeocode(double latitude, double longitude) {

        try {
            if (mapplsStaticKey == null || mapplsStaticKey.isBlank()) {
                System.out.println("MAPPLS STATIC KEY IS NOT CONFIGURED");
                return "Current Location";
            }

            String url = UriComponentsBuilder
                    .fromHttpUrl("https://search.mappls.com/search/address/rev-geocode")
                    .queryParam("lat", latitude)
                    .queryParam("lng", longitude)
                    .queryParam("access_token", mapplsStaticKey)
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

            Object formattedAddress = firstResult.get("formatted_address");

            if (formattedAddress != null) {
                String address = String.valueOf(formattedAddress).trim();

                if (!address.isBlank()) {
                    return address;
                }
            }

            return "Current Location";

        } catch (Exception e) {
            System.out.println(
                    "MAPPLS REVERSE GEOCODING ERROR: " + e.getMessage()
            );
            return "Current Location";
        }
    }
}