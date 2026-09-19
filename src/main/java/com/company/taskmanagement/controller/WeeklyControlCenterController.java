package com.company.taskmanagement.controller;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.WeeklyControlCenterDTO;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.WeeklyControlCenterService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/weekly-control-center")
public class WeeklyControlCenterController {

    @Autowired
    private WeeklyControlCenterService weeklyControlCenterService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public WeeklyControlCenterDTO getWeeklySummary(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @RequestParam(required = false)
            String site,

            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        if (site != null && !site.isBlank()
                && !accessService.hasElevatedAccess(currentUser)
                && !accessService.isGlobalSupervisor(currentUser)
                && !accessService.isSP002(currentUser)
                && !accessService.hasSiteAccess(currentUser, site.trim())) {
            throw new com.company.taskmanagement.exception.ForbiddenException(
                    "You do not have access to this site");
        }

        return weeklyControlCenterService.getWeeklySummary(
                currentUser,
                startDate,
                endDate,
                site);
    }
}