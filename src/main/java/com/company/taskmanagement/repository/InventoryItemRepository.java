package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findBySiteCodeIgnoreCaseOrderByItemNameAsc(String siteCode);

    List<InventoryItem> findByRestockRequiredTrueAndActiveTrueOrderByItemNameAsc();

    List<InventoryItem> findBySiteCodeIgnoreCaseAndRestockRequiredTrueAndActiveTrueOrderByItemNameAsc(String siteCode);

    List<InventoryItem> findByActiveTrueOrderByItemNameAsc();

    List<InventoryItem> findBySiteCodeIgnoreCaseAndActiveTrueOrderByItemNameAsc(String siteCode);
}