package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Client;
import com.company.taskmanagement.entity.ClientFollowUp;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.ClientFollowUpRepository;

@Service
public class ClientFollowUpService {

    @Autowired
    private ClientFollowUpRepository clientFollowUpRepository;

    @Autowired
    private ClientService clientService;

    public List<ClientFollowUp> getAllFollowUps() {
        return clientFollowUpRepository
                .findAllByOrderByCreatedAtDesc();
    }

    public List<ClientFollowUp> getFollowUpsByClient(Long clientId) {
        return clientFollowUpRepository
                .findByClientIdOrderByCreatedAtDesc(clientId);
    }

    public List<ClientFollowUp> getFollowUpsBySite(String siteCode) {
        return clientFollowUpRepository
                .findBySiteCodeIgnoreCaseOrderByCreatedAtDesc(siteCode);
    }

    public List<ClientFollowUp> getTodayFollowUps() {
        return clientFollowUpRepository
                .findByFollowUpDateAndCompletedFalseOrderByCreatedAtAsc(
                        LocalDate.now());
    }

    public List<ClientFollowUp> getOverdueFollowUps() {
        return clientFollowUpRepository
                .findByFollowUpDateBeforeAndCompletedFalseOrderByFollowUpDateAsc(
                        LocalDate.now());
    }

    public ClientFollowUp getFollowUpById(Long id) {
        return clientFollowUpRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Client follow-up not found"));
    }

    public ClientFollowUp createFollowUp(
            Long clientId,
            ClientFollowUp followUp,
            User currentUser) {

        Client client = clientService.getClientById(clientId);

        followUp.setClientId(client.getId());
        followUp.setClientName(client.getClientName());
        followUp.setSiteCode(client.getSiteCode());

        if (followUp.getFollowUpDate() == null) {
            followUp.setFollowUpDate(LocalDate.now());
        }

        followUp.setFollowedUpByUserId(currentUser.getId());
        followUp.setFollowedUpByEmployeeId(currentUser.getEmployeeId());
        followUp.setFollowedUpByName(currentUser.getName());

        followUp.setCompleted(false);

        LocalDateTime now = LocalDateTime.now();
        followUp.setCreatedAt(now);
        followUp.setUpdatedAt(now);

        ClientFollowUp saved =
                clientFollowUpRepository.save(followUp);

        if (followUp.getNextFollowUpDate() != null) {
            clientService.updateNextFollowUpDate(
                    clientId,
                    followUp.getNextFollowUpDate());
        }

        return saved;
    }

    public ClientFollowUp completeFollowUp(
            Long followUpId,
            String outcome,
            LocalDate nextFollowUpDate,
            User currentUser) {

        ClientFollowUp followUp = getFollowUpById(followUpId);

        if (Boolean.TRUE.equals(followUp.getCompleted())) {
            throw new IllegalStateException(
                    "Client follow-up is already completed");
        }

        LocalDateTime now = LocalDateTime.now();

        followUp.setCompleted(true);
        followUp.setCompletedAt(now);
        followUp.setUpdatedAt(now);

        if (outcome != null && !outcome.isBlank()) {
            followUp.setOutcome(outcome);
        }

        followUp.setNextFollowUpDate(nextFollowUpDate);

        ClientFollowUp saved =
                clientFollowUpRepository.save(followUp);

        clientService.updateNextFollowUpDate(
                followUp.getClientId(),
                nextFollowUpDate);

        if (nextFollowUpDate != null) {

            ClientFollowUp nextFollowUp = new ClientFollowUp();

            nextFollowUp.setClientId(followUp.getClientId());
            nextFollowUp.setClientName(followUp.getClientName());
            nextFollowUp.setSiteCode(followUp.getSiteCode());

            nextFollowUp.setFollowUpDate(nextFollowUpDate);
            nextFollowUp.setFollowUpType(followUp.getFollowUpType());
            nextFollowUp.setNotes("Scheduled from previous follow-up");

            nextFollowUp.setFollowedUpByUserId(currentUser.getId());
            nextFollowUp.setFollowedUpByEmployeeId(
                    currentUser.getEmployeeId());
            nextFollowUp.setFollowedUpByName(currentUser.getName());

            nextFollowUp.setCompleted(false);
            nextFollowUp.setCreatedAt(now);
            nextFollowUp.setUpdatedAt(now);

            clientFollowUpRepository.save(nextFollowUp);
        }

        return saved;
    }
}