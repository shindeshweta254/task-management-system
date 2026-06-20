package com.company.taskmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
	Role findByRoleName(String roleName);
}
