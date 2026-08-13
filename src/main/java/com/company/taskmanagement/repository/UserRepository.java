package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.User;

public interface UserRepository
		extends JpaRepository<User, Long> {

	List<User> findByEmployeeId(String employeeId);

	long countByRoleRoleName(String string);

	List<User> findBySiteCode(String siteCode);

	long countBySiteCode(String siteCode);
	List<User> findBySiteCodeIn(List<String> siteCodes);
}
