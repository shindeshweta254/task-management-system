package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.repository.RoleRepository;

@Service
public class RoleService {
	   @Autowired
	    private RoleRepository roleRepository;

	    public Role saveRole(Role role) {
	        return roleRepository.save(role);
	    }

	    public List<Role> getAllRoles() {
	        return roleRepository.findAll();
	    }
}
