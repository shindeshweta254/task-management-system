package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Client;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.ClientService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public ResponseEntity<List<Client>> getClients(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateViewPermission(currentUser);

        List<Client> clients = clientService.getAllClients();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(clients);
        }

        return ResponseEntity.ok(
                clients.stream()
                        .filter(client ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        client.getSiteCode()))
                        .toList());
    }

    @GetMapping("/today-follow-ups")
    public ResponseEntity<List<Client>> getTodayFollowUps(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateViewPermission(currentUser);

        List<Client> clients =
                clientService.getTodayFollowUps();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(clients);
        }

        return ResponseEntity.ok(
                clients.stream()
                        .filter(client ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        client.getSiteCode()))
                        .toList());
    }

    @GetMapping("/overdue-follow-ups")
    public ResponseEntity<List<Client>> getOverdueFollowUps(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateViewPermission(currentUser);

        List<Client> clients =
                clientService.getOverdueFollowUps();

        if (hasGlobalAccess(currentUser)) {
            return ResponseEntity.ok(clients);
        }

        return ResponseEntity.ok(
                clients.stream()
                        .filter(client ->
                                accessService.hasSiteAccess(
                                        currentUser,
                                        client.getSiteCode()))
                        .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClient(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateViewPermission(currentUser);

        Client client = clientService.getClientById(id);

        validateClientAccess(currentUser, client);

        return ResponseEntity.ok(client);
    }

    @PostMapping
    public ResponseEntity<Client> createClient(
            @RequestBody Client client,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateManagePermission(currentUser);

        if (!hasGlobalAccess(currentUser)) {
            accessService.validateSiteAccess(
                    currentUser,
                    client.getSiteCode());
        }

        return ResponseEntity.ok(
                clientService.createClient(client));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> updateClient(
            @PathVariable Long id,
            @RequestBody Client updatedClient,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateManagePermission(currentUser);

        Client existing =
                clientService.getClientById(id);

        validateClientAccess(currentUser, existing);

        if (updatedClient.getSiteCode() != null
                && !updatedClient.getSiteCode().isBlank()
                && !hasGlobalAccess(currentUser)) {

            accessService.validateSiteAccess(
                    currentUser,
                    updatedClient.getSiteCode());
        }

        return ResponseEntity.ok(
                clientService.updateClient(
                        id,
                        updatedClient));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivateClient(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateManagePermission(currentUser);

        Client client =
                clientService.getClientById(id);

        validateClientAccess(currentUser, client);

        clientService.deactivateClient(id);

        return ResponseEntity.ok(
                "Client deactivated successfully");
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

    private void validateViewPermission(User currentUser) {

        if (hasGlobalAccess(currentUser)
                || accessService.isSupervisor(currentUser)
                || accessService.isManager(currentUser)) {
            return;
        }

        throw new com.company.taskmanagement.exception.ForbiddenException(
                "You do not have permission to view client management");
    }

    private void validateManagePermission(User currentUser) {

        if (hasGlobalAccess(currentUser)
                || accessService.isSupervisor(currentUser)
                || accessService.isManager(currentUser)) {
            return;
        }

        throw new com.company.taskmanagement.exception.ForbiddenException(
                "You do not have permission to manage clients");
    }
}