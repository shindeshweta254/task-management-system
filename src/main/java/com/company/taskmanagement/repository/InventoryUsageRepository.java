package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.InventoryUsage;

public interface InventoryUsageRepository extends JpaRepository<InventoryUsage, Long> {

    List<InventoryUsage> findByInventoryItemIdOrderByUsedAtDesc(Long inventoryItemId);

    List<InventoryUsage> findBySiteCodeIgnoreCaseOrderByUsedAtDesc(String siteCode);

    List<InventoryUsage> findByUsedByUserIdOrderByUsedAtDesc(Long usedByUserId);

    List<InventoryUsage> findAllByOrderByUsedAtDesc();
}