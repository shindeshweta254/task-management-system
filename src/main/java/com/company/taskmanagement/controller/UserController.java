package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

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
import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"})
@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private AccessService accessService;

	@PostMapping
	public User saveUser(@RequestBody User user) {
		return userService.saveUser(user);
	}

	@GetMapping
	public List<UserDTO> getAllUsers(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<User> allUsers = userService.getAllUsers();
		List<User> filteredUsers = accessService.filterUsersByAccess(currentUser, allUsers);
		return filteredUsers.stream()
				.map(UserDTO::fromUser)
				.collect(Collectors.toList());
	}

	@PostMapping("/login")
	public UserDTO login(@RequestBody LoginRequest loginRequest) {
		return userService.login(
				loginRequest.getEmployeeId(),
				loginRequest.getEmail(),
				loginRequest.getPassword()
		);
	}

	@PostMapping("/import-staff")
	public ResponseEntity<String> importStaffFromExcel(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request) {

		accessService.resolveUser(request);

		if (file == null || file.isEmpty()) {
			return ResponseEntity.badRequest()
					.body("Please select a valid Excel file");
		}

		String result = userService.importStaffFromExcel(file);
		return ResponseEntity.ok(result);
	}

	@PutMapping("/resign/{userId}")
	public UserDTO resignEmployee(
			@PathVariable Long userId,
			HttpServletRequest request) {

		accessService.resolveAndValidateTargetUser(request, userId);
		User resigned = userService.resignEmployee(userId);
		return UserDTO.fromUser(resigned);
	}

	// Update contact number (Team Edit + Save)
	@PutMapping("/{id}")
	public UserDTO updateContactNo(
			@PathVariable Long id,
			@RequestBody User user,
			HttpServletRequest request
	) {

		accessService.resolveAndValidateTargetUser(request, id);

		// Fetch existing user to avoid overwriting fields with null
		User existing = userService.getUserById(id);
		existing.setContactNo(user.getContactNo());

		User saved = userService.saveUser(existing);
		return UserDTO.fromUser(saved);
	}

	@GetMapping("/me")
	public UserDTO getMyProfile(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		return UserDTO.fromUser(currentUser);
	}

	@GetMapping("/my-site-team")
	public List<UserDTO> getMySiteTeam(HttpServletRequest request) {
		User currentUser = accessService.resolveUser(request);
		List<User> siteUsers = userService.getUsersBySiteCode(currentUser.getSiteCode());
		return siteUsers.stream()
				.map(UserDTO::fromUser)
				.collect(Collectors.toList());
	}

	@GetMapping("/{employeeId}/profile")
	public UserDTO getEmployeeProfile(
			@PathVariable String employeeId,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);
		User targetUser = userService.findUserByEmployeeId(employeeId);

		if (targetUser == null) {
			throw new RuntimeException("User not found with employeeId: " + employeeId);
		}

		accessService.validateTargetEmployee(currentUser, targetUser);
		return UserDTO.fromUser(targetUser);
	}

	@PostMapping("/add-employee")
	public UserDTO addEmployee(
			@RequestBody User newUser,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);

		// Only supervisors, managers, SP001, SP002, admin can add employees
		if (!accessService.isSupervisor(currentUser) && !accessService.isManager(currentUser)
				&& !accessService.isSP001(currentUser) && !accessService.isSP002(currentUser)
				&& !accessService.hasElevatedAccess(currentUser)) {
			throw new com.company.taskmanagement.exception.ForbiddenException(
					"Only supervisors and managers can add employees");
		}

		// Validate that new employee's site is within current user's permitted sites
		if (newUser.getSiteCode() != null && !newUser.getSiteCode().isBlank()) {
			accessService.validateSiteAccess(currentUser, newUser.getSiteCode());
		}

		// Force EMPLOYEE role for supervisor-added users
		User saved = userService.saveUser(newUser);
		return UserDTO.fromUser(saved);
	}
}
