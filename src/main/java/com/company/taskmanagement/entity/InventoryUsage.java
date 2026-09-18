package com.company.taskmanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_usage")
public class InventoryUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long inventoryItemId;
    private String itemName;
    private Double usedQuantity;
    private String unit;
    private String siteCode;

    private Long usedByUserId;
    private String usedByEmployeeId;
    private String usedByName;

    private LocalDateTime usedAt;

    private Boolean supervisorVerified = false;
    private Long verifiedByUserId;
    private String verifiedByName;
    private LocalDateTime verifiedAt;

    public InventoryUsage() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Double getUsedQuantity() {
        return usedQuantity;
    }

    public void setUsedQuantity(Double usedQuantity) {
        this.usedQuantity = usedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getSiteCode() {
        return siteCode;
    }

    public void setSiteCode(String siteCode) {
        this.siteCode = siteCode;
    }

    public Long getUsedByUserId() {
        return usedByUserId;
    }

    public void setUsedByUserId(Long usedByUserId) {
        this.usedByUserId = usedByUserId;
    }

    public String getUsedByEmployeeId() {
        return usedByEmployeeId;
    }

    public void setUsedByEmployeeId(String usedByEmployeeId) {
        this.usedByEmployeeId = usedByEmployeeId;
    }

    public String getUsedByName() {
        return usedByName;
    }

    public void setUsedByName(String usedByName) {
        this.usedByName = usedByName;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public Boolean getSupervisorVerified() {
        return supervisorVerified;
    }

    public void setSupervisorVerified(Boolean supervisorVerified) {
        this.supervisorVerified = supervisorVerified;
    }

    public Long getVerifiedByUserId() {
        return verifiedByUserId;
    }

    public void setVerifiedByUserId(Long verifiedByUserId) {
        this.verifiedByUserId = verifiedByUserId;
    }

    public String getVerifiedByName() {
        return verifiedByName;
    }

    public void setVerifiedByName(String verifiedByName) {
        this.verifiedByName = verifiedByName;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }}