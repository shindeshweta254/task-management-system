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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.InventoryItem;
import com.company.taskmanagement.entity.InventoryUsage;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.InventoryService;
import com.company.taskmanagement.service.InventoryUsageService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryUsageService inventoryUsageService;

    @Autowired
    private AccessService accessService;

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getInventory(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)) {

            return ResponseEntity.ok(inventoryService.getAllItems());
        }

        String siteCode = currentUser.getSiteCode();

        if (siteCode == null || siteCode.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(
                inventoryService.getItemsBySite(siteCode));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItem>> getLowStock(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)) {

            return ResponseEntity.ok(
                    inventoryService.getLowStockItems());
        }

        String siteCode = currentUser.getSiteCode();

        if (siteCode == null || siteCode.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(
                inventoryService.getLowStockItemsBySite(siteCode));
    }

    @GetMapping("/usage-history")
    public ResponseEntity<List<InventoryUsage>> getUsageHistory(
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)) {

            return ResponseEntity.ok(
                    inventoryUsageService.getAllUsage());
        }

        return ResponseEntity.ok(
                inventoryUsageService.getAllUsage()
                        .stream()
                        .filter(usage -> accessService.hasSiteAccess(
                                currentUser,
                                usage.getSiteCode()))
                        .toList());
    }

    @PutMapping("/usage-history/{usageId}/verify")
    public ResponseEntity<InventoryUsage> verifyUsage(
            @PathVariable Long usageId,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateManagePermission(currentUser);

        InventoryUsage usage =
                inventoryUsageService.getUsageById(usageId);

        if (!accessService.hasElevatedAccess(currentUser)
                && !accessService.isGlobalSupervisor(currentUser)
                && !accessService.isSP002(currentUser)) {

            accessService.validateSiteAccess(
                    currentUser,
                    usage.getSiteCode());
        }

        return ResponseEntity.ok(
                inventoryUsageService.verifyUsage(
                        usageId,
                        currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getItem(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        InventoryItem item = inventoryService.getItemById(id);

        validateItemAccess(currentUser, item);

        return ResponseEntity.ok(item);
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(
            @RequestBody InventoryItem item,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        validateManagePermission(currentUser);

        if (!accessService.hasElevatedAccess(currentUser)
                && !accessService.isGlobalSupervisor(currentUser)
                && !accessService.isSP002(currentUser)) {

            accessService.validateSiteAccess(
                    currentUser,
                    item.getSiteCode());
        }

        return ResponseEntity.ok(
                inventoryService.createItem(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateItem(
            @PathVariable Long id,
            @RequestBody InventoryItem updatedItem,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        InventoryItem existing = inventoryService.getItemById(id);

        validateManagePermission(currentUser);
        validateItemAccess(currentUser, existing);

        if (updatedItem.getSiteCode() != null
                && !updatedItem.getSiteCode().isBlank()
                && !accessService.hasElevatedAccess(currentUser)
                && !accessService.isGlobalSupervisor(currentUser)
                && !accessService.isSP002(currentUser)) {

            accessService.validateSiteAccess(
                    currentUser,
                    updatedItem.getSiteCode());
        }

        return ResponseEntity.ok(
                inventoryService.updateItem(id, updatedItem));
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<InventoryItem> restock(
            @PathVariable Long id,
            @RequestParam Double quantity,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        InventoryItem item = inventoryService.getItemById(id);

        validateManagePermission(currentUser);
        validateItemAccess(currentUser, item);

        return ResponseEntity.ok(
                inventoryService.addStock(id, quantity));
    }

    @PostMapping("/{id}/use")
    public ResponseEntity<InventoryItem> useStock(
            @PathVariable Long id,
            @RequestParam Double quantity,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        InventoryItem item = inventoryService.getItemById(id);

        validateItemAccess(currentUser, item);

        return ResponseEntity.ok(
                inventoryService.useStock(id, quantity));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivate(
            @PathVariable Long id,
            HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);
        InventoryItem item = inventoryService.getItemById(id);

        validateManagePermission(currentUser);
        validateItemAccess(currentUser, item);

        inventoryService.deactivateItem(id);

        return ResponseEntity.ok(
                "Inventory item deactivated successfully");
    }

    private void validateItemAccess(
            User currentUser,
            InventoryItem item) {

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)) {
            return;
        }

        accessService.validateSiteAccess(
                currentUser,
                item.getSiteCode());
    }

    private void validateManagePermission(User currentUser) {

        if (accessService.hasElevatedAccess(currentUser)
                || accessService.isGlobalSupervisor(currentUser)
                || accessService.isSP002(currentUser)
                || accessService.isSupervisor(currentUser)
                || accessService.isManager(currentUser)) {
            return;
        }

        throw new com.company.taskmanagement.exception.ForbiddenException(
                "You do not have permission to manage inventory");
    }
}
 