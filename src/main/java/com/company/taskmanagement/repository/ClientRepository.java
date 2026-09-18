package com.company.taskmanagement.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Client;

public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByActiveTrueOrderByClientNameAsc();

    List<Client> findBySiteCodeIgnoreCaseAndActiveTrueOrderByClientNameAsc(
            String siteCode);

    List<Client> findByNextFollowUpDateAndActiveTrueOrderByClientNameAsc(
            LocalDate nextFollowUpDate);

    List<Client> findByNextFollowUpDateBeforeAndActiveTrueOrderByNextFollowUpDateAsc(
            LocalDate date);
}