package com.company.taskmanagement.dto;

import com.company.taskmanagement.entity.User;

public class IncidentUserDTO {

    private Long id;
    private String employeeId;
    private String name;

    public IncidentUserDTO() {
    }

    public IncidentUserDTO(Long id, String employeeId, String name) {
        this.id = id;
        this.employeeId = employeeId;
        this.name = name;
    }

    public static IncidentUserDTO fromUser(User user) {
        if (user == null) {
            return null;
        }

        return new IncidentUserDTO(
                user.getId(),
                user.getEmployeeId(),
                user.getName());
    }

    public Long getId() {
        return id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public String getName() {
        return name;
    }
}