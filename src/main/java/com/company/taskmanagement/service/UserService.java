package com.company.taskmanagement.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.RoleRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class UserService {
	@Autowired
	UserRepository userRepository;

	@Autowired
	private RoleRepository roleRepository;

	public User saveUser(User user) {

		if (user.getRole() != null) {

			Role role = roleRepository.findByRoleName(user.getRole().getRoleName());

			user.setRole(role);
		}
		return userRepository.save(user);
	}

	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	public User login(String employeeId, String email, String password) {

	    User user = userRepository.findByEmployeeIdAndEmailAndPassword(
	            employeeId.trim(),
	            email.trim(),
	            password.trim()
	    );

	    if (user != null) {
	        return user;
	    }

	    throw new RuntimeException("Invalid Employee ID, Email or Password");
	}
	public User resignEmployee(Long userId) {

	    User user = userRepository.findById(userId)
	            .orElseThrow(() ->
	                    new RuntimeException("User Not Found"));

	    user.setStatus("RESIGNED");

	    return userRepository.save(user);
	}

	
}
