package com.company.taskmanagement.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.dto.JwtResponse;
import com.company.taskmanagement.dto.LoginRequest;
import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.repository.RoleRepository;
import com.company.taskmanagement.security.JwtUtil;
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
        private RoleRepository roleRepository;

@Autowired
	private AccessService accessService;
@Autowired
private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtUtil jwtUtil;

	@PostMapping
        public User saveUser(
                @RequestBody User user,
                HttpServletRequest request) {

                User currentUser = accessService.resolveUser(request);

                if (!accessService.isDirector(currentUser)
                        && !accessService.isAdmin(currentUser)) {
                        throw new com.company.taskmanagement.exception.ForbiddenException(
                                "Only Director or Admin can create users");
                }

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

/**
 * Returns all users for task/checklist assignment dropdowns.
 */
@GetMapping("/task-assignees")
public List<UserDTO> getTaskAssignees(HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        List<User> allUsers = userService.getAllUsers();

        List<User> filteredUsers =
                accessService.filterUsersByAccess(currentUser, allUsers);

        return filteredUsers.stream()
                        .map(UserDTO::fromUser)
                        .collect(Collectors.toList());
}

/**
 * Employee Add Task dropdown:
 * logged-in employee + fixed reviewers only.
 */
@GetMapping("/employee-task-assignees")
public List<UserDTO> getEmployeeTaskAssignees(HttpServletRequest request) {

        User currentUser = accessService.resolveUser(request);

        if (!accessService.isEmployee(currentUser)) {
                return java.util.Collections.emptyList();
        }

        List<User> allUsers = userService.getAllUsers();

        return allUsers.stream()
                .filter(u ->
                        u.getId().equals(currentUser.getId())
                        || "CP001".equalsIgnoreCase(u.getEmployeeId())
                        || "CP002".equalsIgnoreCase(u.getEmployeeId())
                        || "CP003".equalsIgnoreCase(u.getEmployeeId())
                        || "SP002".equalsIgnoreCase(u.getEmployeeId())
                )
                .map(UserDTO::fromUser)
                .collect(Collectors.toList());
}
@PostMapping("/login")
	public JwtResponse login(@RequestBody LoginRequest loginRequest) {
		UserDTO user = userService.login(
				loginRequest.getEmployeeId(),
				loginRequest.getEmail(),
				loginRequest.getPassword()
		);
		String token = jwtUtil.generateToken(user.getEmployeeId());
		return new JwtResponse(token, "Bearer", user);
	}

	@PostMapping("/import-staff")
	public ResponseEntity<String> importStaffFromExcel(
			@RequestParam("file") MultipartFile file,
			HttpServletRequest request) {

		User currentUser = accessService.resolveUser(request);

                if (!accessService.isDirector(currentUser)
                        && !accessService.isAdmin(currentUser)) {
                        throw new com.company.taskmanagement.exception.ForbiddenException(
                                "Only Director or Admin can import staff");
                }

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
	}        // Update employee details from Team page
        @PutMapping("/{id}")
        public UserDTO updateEmployee(
                        @PathVariable Long id,
                        @RequestBody User user,
                        HttpServletRequest request
        ) {

                accessService.resolveAndValidateTargetUser(request, id);

                User existing = userService.getUserById(id);

                if (user.getName() != null) {
                        existing.setName(user.getName().trim());
                }

                if (user.getEmail() != null) {
                        existing.setEmail(user.getEmail().trim());
                }

                if (user.getContactNo() != null) {
                        existing.setContactNo(user.getContactNo().trim());
                }

                if (user.getDepartment() != null) {
                        existing.setDepartment(user.getDepartment().trim());
                }

                if (user.getDesignation() != null) {
                        existing.setDesignation(user.getDesignation().trim());
                }

                if (user.getShift() != null) {
                        existing.setShift(user.getShift().trim());
                }

                if (user.getSiteCode() != null) {
                        existing.setSiteCode(user.getSiteCode().trim());
                }

                if (user.getStatus() != null) {
                        existing.setStatus(user.getStatus().trim());
                }

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

@GetMapping("/site/{siteCode}")
public List<UserDTO> getUsersBySiteCode(
        @PathVariable("siteCode") String siteCode
) {
    List<User> siteUsers = userService.getUsersBySiteCode(siteCode);

    return siteUsers.stream()
            .map(UserDTO::fromUser)
            .collect(Collectors.toList());
}
@GetMapping("/{employeeId}/profile")
public UserDTO getEmployeeProfile(
        @PathVariable("employeeId") String employeeId,
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
		if (!accessService.hasElevatedAccess(currentUser)) {
                  if (newUser.getSiteCode() == null || newUser.getSiteCode().isBlank()) {
                          throw new com.company.taskmanagement.exception.ForbiddenException(
                                  "Site code is required");
                  }

                  com.company.taskmanagement.entity.Role employeeRole =
                          roleRepository.findByRoleName("EMPLOYEE");

                  if (employeeRole == null) {
                          throw new IllegalStateException("EMPLOYEE role not found");
                  }

                  newUser.setRole(employeeRole);
          }

          User saved = userService.saveUser(newUser);
		return UserDTO.fromUser(saved);
	}
	
	@GetMapping("/supervisor/employees")
        public List<UserDTO> getSupervisorEmployees(HttpServletRequest request) {

            User currentUser = accessService.resolveUser(request);

            if (!accessService.isSupervisor(currentUser)) {
                throw new com.company.taskmanagement.exception.ForbiddenException(
                        "Only supervisors can view their team");
            }

            return userService.getSupervisorEmployees(currentUser.getId())
                    .stream()
                    .map(UserDTO::fromUser)
                    .collect(Collectors.toList());
        }
        // ===== Site Management: Supervisor Management =====

        @PostMapping("/site-management/supervisors")
        public UserDTO addSiteManagementSupervisor(
                        @RequestBody User newSupervisor,
                        HttpServletRequest request) {

                User currentUser = accessService.resolveUser(request);

                if (!accessService.isDirector(currentUser) && !accessService.isSP001(currentUser)) {
                        throw new com.company.taskmanagement.exception.ForbiddenException(
                                        "Only Director or SP001 can add supervisors");
                }

                if (newSupervisor.getEmployeeId() == null ||
                                newSupervisor.getEmployeeId().trim().isEmpty()) {
                        throw new IllegalArgumentException("Employee ID is required");
                }

                if (newSupervisor.getName() == null ||
                                newSupervisor.getName().trim().isEmpty()) {
                        throw new IllegalArgumentException("Supervisor name is required");
                }

                User existingUser = userService.findUserByEmployeeId(
                                newSupervisor.getEmployeeId().trim());

                if (existingUser != null) {
                        throw new IllegalArgumentException(
                                        "Employee ID already exists: " +
                                                        newSupervisor.getEmployeeId().trim());
                }

                Role supervisorRole = roleRepository.findByRoleName("SUPERVISOR");

                if (supervisorRole == null) {
                        throw new IllegalStateException("SUPERVISOR role not found");
                }

                newSupervisor.setId(null);
                newSupervisor.setEmployeeId(
                                newSupervisor.getEmployeeId().trim().toUpperCase());
                newSupervisor.setName(newSupervisor.getName().trim());
                newSupervisor.setRole(supervisorRole);
                newSupervisor.setStatus("ACTIVE");

                if (newSupervisor.getSiteCode() != null) {
                        newSupervisor.setSiteCode(newSupervisor.getSiteCode().trim());
                }

                User saved = userService.saveUser(newSupervisor);
                return UserDTO.fromUser(saved);
        }

        @PatchMapping("/site-management/supervisors/{id}/deactivate")
        public UserDTO deactivateSiteManagementSupervisor(
                        @PathVariable Long id,
                        HttpServletRequest request) {

                User currentUser = accessService.resolveUser(request);

                if (!accessService.isDirector(currentUser) && !accessService.isSP001(currentUser)) {
                        throw new com.company.taskmanagement.exception.ForbiddenException(
                                        "Only Director or SP001 can deactivate supervisors");
                }

                User supervisor = userService.getUserById(id);

                if (supervisor == null) {
                        throw new IllegalArgumentException("Supervisor not found");
                }

                if (supervisor.getRole() == null ||
                                !"SUPERVISOR".equalsIgnoreCase(supervisor.getRole().getRoleName())) {
                        throw new IllegalArgumentException("Selected user is not a supervisor");
                }

                String employeeId = supervisor.getEmployeeId() == null
                                ? ""
                                : supervisor.getEmployeeId().trim().toUpperCase();

                if ("SP001".equals(employeeId) || "SP002".equals(employeeId)) {
                        throw new IllegalArgumentException(
                                        "SP001 and SP002 cannot be deactivated");
                }

                supervisor.setStatus("INACTIVE");

                User saved = userService.saveUser(supervisor);
                return UserDTO.fromUser(saved);
        }

	@PostMapping("/reset-password/{userId}")
	public String resetPassword(@PathVariable Long userId) {

	    User user = userService.getUserById(userId);

	    user.setPassword(
	        passwordEncoder.encode("sss@123")
	    );

	    userService.saveUser(user);

	    return "Password reset successful";
	}
}

