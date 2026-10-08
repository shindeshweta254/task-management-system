package com.company.taskmanagement.controller;

import com.company.taskmanagement.entity.Site;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.SiteService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    @Autowired
    private SiteService siteService;

    @Autowired
    private AccessService accessService;

    // All authenticated users can load active sites for dropdowns/modules.
    @GetMapping("/active")
    public List<Site> getActiveSites(HttpServletRequest request) {
        accessService.resolveUser(request);
        return siteService.getActiveSites();
    }

    // Director + SP001 can view complete Site Management list.
    @GetMapping
    public List<Site> getAllSites(HttpServletRequest request) {
        User currentUser = accessService.resolveUser(request);
        validateSiteManagementAccess(currentUser);
        return siteService.getAllSites();
    }

    // Director + SP001 can create a new site.
    @PostMapping
    public Site createSite(
            @RequestBody Site site,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validateSiteManagementAccess(currentUser);

        return siteService.createSite(site);
    }

    // Site code stays stable; name/status can be updated.
    @PutMapping("/{id}")
    public Site updateSite(
            @PathVariable Long id,
            @RequestBody Site site,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validateSiteManagementAccess(currentUser);

        return siteService.updateSite(id, site);
    }

    // Deactivate instead of deleting historical site data.
    @PatchMapping("/{id}/status")
    public Site updateSiteStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validateSiteManagementAccess(currentUser);

        return siteService.setActive(id, active);
    }

    private void validateSiteManagementAccess(User user) {
        if (!accessService.isDirector(user) && !accessService.isSP001(user)) {
            throw new ForbiddenException("Access denied to Site Management");
        }
    }
}