package com.company.taskmanagement.repository;

import java.util.List;

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

	List<User> findBySiteCode(String siteCode);

	long countBySiteCode(String siteCode);
}
