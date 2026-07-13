package com.company.taskmanagement.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.User;

public interface UserRepository
		extends JpaRepository<User, Long> {

	User findByEmployeeId(String employeeId);

	User findByEmployeeIdAndEmailAndPassword(
			String employeeId,
			String email,
			String password
	);

	long countByRoleRoleName(String string);
}