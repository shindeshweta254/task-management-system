package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.taskmanagement.dto.LoginRequest;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.UserService;
@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	UserService userService;

	@PostMapping
	public User saveUser(@RequestBody User user) {
		return userService.saveUser(user);
	}

	@GetMapping
	public List<User> getAllUsers() {
		return userService.getAllUsers();
	}

	@PostMapping("/login")
	public User login(@RequestBody LoginRequest loginRequest) {
	    return userService.login(
	            loginRequest.getEmployeeId(),
	            loginRequest.getEmail(),
	            loginRequest.getPassword()
	    );
	}
	
	@PutMapping("/resign/{userId}")
	public User resignEmployee(@PathVariable Long userId) {

		return userService.resignEmployee(userId);
	}

}
