package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.service.RoleService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/roles")
public class ReleController {
	 @Autowired
	    private RoleService roleService;

	    @PostMapping
	    public Role saveRole(@RequestBody Role role) {
	        return roleService.saveRole(role);
	    }

	    @GetMapping
	    public List<Role> getAllRoles() {
	        return roleService.getAllRoles();
	    }
	}

