package com.company.taskmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
	User findByEmail(String email);

	long countByRoleRoleName(String roleName);
}
