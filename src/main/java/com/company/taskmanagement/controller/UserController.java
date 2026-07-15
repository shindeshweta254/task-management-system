package com.company.taskmanagement.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.dto.LoginRequest;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.UserService;

@CrossOrigin(origins = "http://localhost:5176")
@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserService userService;

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

	@PostMapping("/import-staff")
	public ResponseEntity<String> importStaffFromExcel(
			@RequestParam("file") MultipartFile file) {

		if (file == null || file.isEmpty()) {
			return ResponseEntity.badRequest()
					.body("Please select a valid Excel file");
		}

		String result = userService.importStaffFromExcel(file);
		return ResponseEntity.ok(result);
	}

	@PutMapping("/resign/{userId}")
	public User resignEmployee(@PathVariable Long userId) {
		return userService.resignEmployee(userId);
	}

	// Update contact number (Team Edit + Save)
	@PutMapping("/{id}")
	public User updateContactNo(
			@PathVariable Long id,
			@RequestBody User user
	) {

		// Fetch existing user to avoid overwriting fields with null
		User existing = userService.getUserById(id);
		existing.setContactNo(user.getContactNo());

		return userService.saveUser(existing);
	}
}
