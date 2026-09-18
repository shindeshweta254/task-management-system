package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.InventoryItem;
import com.company.taskmanagement.entity.InventoryUsage;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.InventoryUsageRepository;

@Service
public class InventoryUsageService {

    @Autowired
    private InventoryUsageRepository inventoryUsageRepository;

    public InventoryUsage recordUsage(
            InventoryItem item,
            Double quantity,
            User user) {

        InventoryUsage usage = new InventoryUsage();

        usage.setInventoryItemId(item.getId());
        usage.setItemName(item.getItemName());
        usage.setUsedQuantity(quantity);
        usage.setUnit(item.getUnit());
        usage.setSiteCode(item.getSiteCode());

        usage.setUsedByUserId(user.getId());
        usage.setUsedByEmployeeId(user.getEmployeeId());
        usage.setUsedByName(user.getName());

        usage.setUsedAt(LocalDateTime.now());

        return inventoryUsageRepository.save(usage);
    }

    public List<InventoryUsage> getAllUsage() {
        return inventoryUsageRepository.findAllByOrderByUsedAtDesc();
    }

    public List<InventoryUsage> getUsageBySite(String siteCode) {
        return inventoryUsageRepository
                .findBySiteCodeIgnoreCaseOrderByUsedAtDesc(siteCode);
    }

    public List<InventoryUsage> getUsageByItem(Long inventoryItemId) {
        return inventoryUsageRepository
                .findByInventoryItemIdOrderByUsedAtDesc(inventoryItemId);
    }

    public List<InventoryUsage> getUsageByUser(Long userId) {
        return inventoryUsageRepository
                .findByUsedByUserIdOrderByUsedAtDesc(userId);
    }


    public InventoryUsage getUsageById(Long usageId) {
        return inventoryUsageRepository.findById(usageId)
                .orElseThrow(() ->
                        new RuntimeException("Inventory usage not found: " + usageId));
    }
    public InventoryUsage verifyUsage(
            Long usageId,
            User verifier) {

        InventoryUsage usage = inventoryUsageRepository.findById(usageId)
                .orElseThrow(() ->
                        new RuntimeException("Inventory usage not found: " + usageId));

        if (Boolean.TRUE.equals(usage.getSupervisorVerified())) {
            throw new IllegalStateException(
                    "Inventory usage is already verified");
        }

        usage.setSupervisorVerified(true);
        usage.setVerifiedByUserId(verifier.getId());
        usage.setVerifiedByName(verifier.getName());
        usage.setVerifiedAt(LocalDateTime.now());

        return inventoryUsageRepository.save(usage);
    }
}