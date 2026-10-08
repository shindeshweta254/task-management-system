package com.company.taskmanagement.service;

import com.company.taskmanagement.entity.Site;
import com.company.taskmanagement.repository.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SiteService {

    @Autowired
    private SiteRepository siteRepository;

    public List<Site> getAllSites() {
        return siteRepository.findAllByOrderBySiteNameAsc();
    }

    public List<Site> getActiveSites() {
        return siteRepository.findByActiveTrueOrderBySiteNameAsc();
    }

    public Site getSiteById(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found: " + id));
    }

    public Site createSite(Site site) {

        String siteCode = normalizeSiteCode(site.getSiteCode());
        String siteName = normalizeSiteName(site.getSiteName());

        if (siteRepository.existsBySiteCodeIgnoreCase(siteCode)) {
            throw new RuntimeException("Site code already exists: " + siteCode);
        }

        site.setSiteCode(siteCode);
        site.setSiteName(siteName);

        if (site.getActive() == null) {
            site.setActive(true);
        }

        return siteRepository.save(site);
    }

    public Site updateSite(Long id, Site request) {

        Site existing = getSiteById(id);

        if (request.getSiteName() != null && !request.getSiteName().isBlank()) {
            existing.setSiteName(normalizeSiteName(request.getSiteName()));
        }

        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }

        return siteRepository.save(existing);
    }

    public Site setActive(Long id, boolean active) {
        Site site = getSiteById(id);
        site.setActive(active);
        return siteRepository.save(site);
    }

    private String normalizeSiteCode(String siteCode) {
        if (siteCode == null || siteCode.isBlank()) {
            throw new RuntimeException("Site code is required");
        }

        return siteCode.trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private String normalizeSiteName(String siteName) {
        if (siteName == null || siteName.isBlank()) {
            throw new RuntimeException("Site name is required");
        }

        return siteName.trim();
    }
}