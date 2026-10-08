package com.company.taskmanagement.repository;

import com.company.taskmanagement.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {

    Optional<Site> findBySiteCodeIgnoreCase(String siteCode);

    boolean existsBySiteCodeIgnoreCase(String siteCode);

    List<Site> findByActiveTrueOrderBySiteNameAsc();

    List<Site> findAllByOrderBySiteNameAsc();
}