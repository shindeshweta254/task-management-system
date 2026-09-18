package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.InventoryItem;
import com.company.taskmanagement.repository.InventoryItemRepository;

@Service
public class InventoryService {

    @Autowired
    private InventoryItemRepository inventoryItemRepository;

    public List<InventoryItem> getAllItems() {
        return inventoryItemRepository.findByActiveTrueOrderByItemNameAsc();
    }

    public List<InventoryItem> getItemsBySite(String siteCode) {
        return inventoryItemRepository
                .findBySiteCodeIgnoreCaseAndActiveTrueOrderByItemNameAsc(siteCode);
    }

    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository
                .findByRestockRequiredTrueAndActiveTrueOrderByItemNameAsc();
    }

    public List<InventoryItem> getLowStockItemsBySite(String siteCode) {
        return inventoryItemRepository
                .findBySiteCodeIgnoreCaseAndRestockRequiredTrueAndActiveTrueOrderByItemNameAsc(siteCode);
    }

    public InventoryItem getItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Inventory item not found: " + id));
    }

    public InventoryItem createItem(InventoryItem item) {

        LocalDateTime now = LocalDateTime.now();

        if (item.getCurrentStock() == null) {
            item.setCurrentStock(0.0);
        }

        if (item.getMinimumStock() == null) {
            item.setMinimumStock(0.0);
        }

        if (item.getActive() == null) {
            item.setActive(true);
        }

        updateRestockStatus(item);

        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        return inventoryItemRepository.save(item);
    }

    public InventoryItem updateItem(Long id, InventoryItem updatedItem) {

        InventoryItem existing = getItemById(id);

        existing.setItemName(updatedItem.getItemName());
        existing.setCategory(updatedItem.getCategory());
        existing.setCurrentStock(updatedItem.getCurrentStock());
        existing.setMinimumStock(updatedItem.getMinimumStock());
        existing.setUnit(updatedItem.getUnit());
        existing.setSiteCode(updatedItem.getSiteCode());
        existing.setLastRestockedAt(updatedItem.getLastRestockedAt());
        existing.setEquipmentCondition(updatedItem.getEquipmentCondition());

        if (updatedItem.getActive() != null) {
            existing.setActive(updatedItem.getActive());
        }

        if (existing.getCurrentStock() == null) {
            existing.setCurrentStock(0.0);
        }

        if (existing.getMinimumStock() == null) {
            existing.setMinimumStock(0.0);
        }

        updateRestockStatus(existing);

        existing.setUpdatedAt(LocalDateTime.now());

        return inventoryItemRepository.save(existing);
    }

    public InventoryItem addStock(Long id, Double quantity) {

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException(
                    "Restock quantity must be greater than zero");
        }

        InventoryItem item = getItemById(id);

        double current = item.getCurrentStock() == null
                ? 0.0
                : item.getCurrentStock();

        item.setCurrentStock(current + quantity);
        item.setLastRestockedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        updateRestockStatus(item);

        return inventoryItemRepository.save(item);
    }

    public InventoryItem useStock(Long id, Double quantity) {

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException(
                    "Usage quantity must be greater than zero");
        }

        InventoryItem item = getItemById(id);

        double current = item.getCurrentStock() == null
                ? 0.0
                : item.getCurrentStock();

        if (quantity > current) {
            throw new IllegalArgumentException(
                    "Insufficient stock. Available stock: " + current);
        }

        item.setCurrentStock(current - quantity);
        item.setUpdatedAt(LocalDateTime.now());

        updateRestockStatus(item);

        return inventoryItemRepository.save(item);
    }

    public void deactivateItem(Long id) {

        InventoryItem item = getItemById(id);

        item.setActive(false);
        item.setUpdatedAt(LocalDateTime.now());

        inventoryItemRepository.save(item);
    }

    private void updateRestockStatus(InventoryItem item) {

        double current = item.getCurrentStock() == null
                ? 0.0
                : item.getCurrentStock();

        double minimum = item.getMinimumStock() == null
                ? 0.0
                : item.getMinimumStock();

        item.setRestockRequired(current <= minimum);
    }
}