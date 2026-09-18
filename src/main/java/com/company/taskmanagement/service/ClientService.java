package com.company.taskmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Client;
import com.company.taskmanagement.repository.ClientRepository;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public List<Client> getAllClients() {
        return clientRepository.findByActiveTrueOrderByClientNameAsc();
    }

    public List<Client> getClientsBySite(String siteCode) {
        return clientRepository
                .findBySiteCodeIgnoreCaseAndActiveTrueOrderByClientNameAsc(siteCode);
    }

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Client not found"));
    }

    public List<Client> getTodayFollowUps() {
        return clientRepository
                .findByNextFollowUpDateAndActiveTrueOrderByClientNameAsc(
                        LocalDate.now());
    }

    public List<Client> getOverdueFollowUps() {
        return clientRepository
                .findByNextFollowUpDateBeforeAndActiveTrueOrderByNextFollowUpDateAsc(
                        LocalDate.now());
    }

    public Client createClient(Client client) {

        if (client.getClientName() == null
                || client.getClientName().isBlank()) {
            throw new IllegalArgumentException(
                    "Client name is required");
        }

        if (client.getStatus() == null
                || client.getStatus().isBlank()) {
            client.setStatus("NEW");
        }

        if (client.getQuoteStatus() == null
                || client.getQuoteStatus().isBlank()) {
            client.setQuoteStatus("NOT_SENT");
        }

        client.setActive(true);

        LocalDateTime now = LocalDateTime.now();
        client.setCreatedAt(now);
        client.setUpdatedAt(now);

        return clientRepository.save(client);
    }

    public Client updateClient(Long id, Client updatedClient) {

        Client existing = getClientById(id);

        existing.setClientName(updatedClient.getClientName());
        existing.setCompanyName(updatedClient.getCompanyName());
        existing.setContactPerson(updatedClient.getContactPerson());
        existing.setContactNumber(updatedClient.getContactNumber());
        existing.setEmail(updatedClient.getEmail());
        existing.setSiteCode(updatedClient.getSiteCode());
        existing.setServiceType(updatedClient.getServiceType());
        existing.setContactSource(updatedClient.getContactSource());
        existing.setRequiredDate(updatedClient.getRequiredDate());
        existing.setQuoteStatus(updatedClient.getQuoteStatus());
        existing.setStatus(updatedClient.getStatus());
        existing.setNextFollowUpDate(updatedClient.getNextFollowUpDate());
        existing.setRemarks(updatedClient.getRemarks());

        existing.setUpdatedAt(LocalDateTime.now());

        return clientRepository.save(existing);
    }

    public Client updateNextFollowUpDate(
            Long clientId,
            LocalDate nextFollowUpDate) {

        Client client = getClientById(clientId);

        client.setNextFollowUpDate(nextFollowUpDate);
        client.setUpdatedAt(LocalDateTime.now());

        return clientRepository.save(client);
    }

    public Client deactivateClient(Long id) {

        Client client = getClientById(id);

        client.setActive(false);
        client.setUpdatedAt(LocalDateTime.now());

        return clientRepository.save(client);
    }
}