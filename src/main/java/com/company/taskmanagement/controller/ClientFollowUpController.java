package com.company.taskmanagement.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Client;
import com.company.taskmanagement.entity.ClientFollowUp;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ClientFollowUpService;
import com.company.taskmanagement.service.ClientService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/client-follow-ups")
public class ClientFollowUpController {

    @Autowired
    private ClientFollowUpService clientFollowUpService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public ResponseEntity<List<ClientFollowUp>> getAllFollowUps(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        List<ClientFollowUp> followUps =
                clientFollowUpService.getAllFollowUps();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(followUps);
        }

        return ResponseEntity.ok(
                followUps.stream()
                        .filter(followUp ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        followUp.getSiteCode()))
                        .toList());
    }

    @GetMapping("/today")
    public ResponseEntity<List<ClientFollowUp>> getTodayFollowUps(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        List<ClientFollowUp> followUps =
                clientFollowUpService.getTodayFollowUps();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(followUps);
        }

        return ResponseEntity.ok(
                followUps.stream()
                        .filter(followUp ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        followUp.getSiteCode()))
                        .toList());
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<ClientFollowUp>> getOverdueFollowUps(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        List<ClientFollowUp> followUps =
                clientFollowUpService.getOverdueFollowUps();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(followUps);
        }

        return ResponseEntity.ok(
                followUps.stream()
                        .filter(followUp ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        followUp.getSiteCode()))
                        .toList());
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ClientFollowUp>> getClientFollowUps(
            @PathVariable Long clientId,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        Client client = clientService.getClientById(clientId);
        validateClientAccess(currentUser, client);

        return ResponseEntity.ok(
                clientFollowUpService.getFollowUpsByClient(clientId));
    }

    @PostMapping("/client/{clientId}")
    public ResponseEntity<ClientFollowUp> createFollowUp(
            @PathVariable Long clientId,
            @RequestBody ClientFollowUp followUp,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        Client client = clientService.getClientById(clientId);
        validateClientAccess(currentUser, client);

        return ResponseEntity.ok(
                clientFollowUpService.createFollowUp(
                        clientId,
                        followUp,
                        currentUser));
    }

    @PutMapping("/{followUpId}/complete")
    public ResponseEntity<ClientFollowUp> completeFollowUp(
            @PathVariable Long followUpId,
            @RequestParam(required = false) String outcome,
            @RequestParam(required = false) LocalDate nextFollowUpDate,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        validatePermission(currentUser);

        ClientFollowUp followUp =
                clientFollowUpService.getFollowUpById(followUpId);

        validateFollowUpAccess(currentUser, followUp);

        return ResponseEntity.ok(
                clientFollowUpService.completeFollowUp(
                        followUpId,
                        outcome,
                        nextFollowUpDate,
                        currentUser));
    }

    private boolean hasGlobalAccess(User currentUser) {

        return accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser);
    }

    private void validateClientAccess(
            User currentUser,
            Client client) {

        if (hasGlobalAccess(currentUser)) {
            return;
        }

        accessService.validateSiteAccess(
                currentUser,
                client.getSiteCode());
    }

    private void validateFollowUpAccess(
            User currentUser,
            ClientFollowUp followUp) {

        if (hasGlobalAccess(currentUser)) {
            return;
        }

        accessService.validateSiteAccess(
                currentUser,
                followUp.getSiteCode());
    }

    private void validatePermission(User currentUser) {

        if (hasGlobalAccess(currentUser)
                || accessService.isSupervisor(currentUser)
                || accessService.isManager(currentUser)) {
            return;
        }

        throw new com.company.taskmanagement.exception.ForbiddenException(
                "You do not have permission to manage client follow-ups");
    }
}