package com.company.taskmanagement.service;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import com.company.taskmanagement.exception.UnauthorizedException;
import com.company.taskmanagement.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Central authorization service for the entire application.
 *
 * Resolves the current user from the X-User-Id header,
 * validates site access, record ownership, and role-based permissions.
 */
@Service
public class AccessService {

    private static final String USER_ID_HEADER = "X-User-Id";

    // Known special employee IDs
    private static final String SP001 = "SP001";
    private static final String SP002 = "SP002";

    // Known role IDs from database
    private static final long ROLE_ADMIN = 1L;
    private static final long ROLE_MANAGER = 2L;
    private static final long ROLE_EMPLOYEE = 3L;
    private static final long ROLE_DIRECTOR = 4L;
    private static final long ROLE_ACCOUNTANT = 6L;
    private static final long ROLE_SUPERVISOR = 10L;

    @Autowired
    private UserRepository userRepository;

    // ========== USER RESOLUTION ==========

    /**
     * Resolve the current user from the X-User-Id header.
     * Throws 401 if header missing, user not found, or user is inactive.
     */
    public User resolveUser(HttpServletRequest request) {
        String userIdStr = request.getHeader(USER_ID_HEADER);
        if (userIdStr == null || userIdStr.isBlank()) {
            throw new UnauthorizedException("Missing X-User-Id header");
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdStr.trim());
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Invalid X-User-Id: must be a number");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found for ID: " + userId));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("User account is not active");
        }

        return user;
    }

    /**
     * Resolve current user and return their employeeId as a String.
     * Convenience for special employee ID checks.
     */
    public String getCurrentEmployeeId(HttpServletRequest request) {
        return resolveUser(request).getEmployeeId();
    }

    // ========== SITE ACCESS ==========

    /**
     * Parse permitted sites from the user's site_code.
     * Returns empty set if site_code is null/blank.
     * "ALL" means all sites.
     */
    public Set<String> getPermittedSites(User user) {
        String siteCode = user.getSiteCode();
        if (siteCode == null || siteCode.isBlank()) {
            return Collections.emptySet();
        }
        String trimmed = siteCode.trim();
        if ("ALL".equalsIgnoreCase(trimmed)) {
            return Collections.singleton("ALL");
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toUpperCase)
                .collect(Collectors.toSet());
    }

    /**
     * Check if a user has access to a given target site.
     * Handles "ALL", comma-separated, case-insensitive matching.
     */
    public boolean hasSiteAccess(User user, String targetSite) {
        if (targetSite == null || targetSite.isBlank()) {
            return false;
        }
        Set<String> permitted = getPermittedSites(user);
        if (permitted.contains("ALL")) {
            return true;
        }
        return permitted.contains(targetSite.trim().toUpperCase());
    }

    /**
     * Validate that the current user has access to the target site.
     * Throws 403 Forbidden if not.
     */
    public void validateSiteAccess(User currentUser, String targetSite) {
        if (!hasSiteAccess(currentUser, targetSite)) {
            throw new ForbiddenException("Access denied to site: " + targetSite);
        }
    }

    /**
     * Get the union of permitted sites from a list of users.
     * If any user has "ALL", result is ["ALL"].
     */
    public Set<String> getUnionPermittedSites(List<User> users) {
        Set<String> union = new HashSet<>();
        for (User user : users) {
            Set<String> sites = getPermittedSites(user);
            if (sites.contains("ALL")) {
                return Collections.singleton("ALL");
            }
            union.addAll(sites);
        }
        return union;
    }

    // ========== SPECIAL EMPLOYEE CHECKS ==========

    public boolean isSP001(User user) {
        return SP001.equalsIgnoreCase(user.getEmployeeId());
    }

    public boolean isSP002(User user) {
        return SP002.equalsIgnoreCase(user.getEmployeeId());
    }

    public boolean isDirector(User user) {
        return user.getRole() != null && user.getRole().getId() == ROLE_DIRECTOR;
    }

    public boolean isAdmin(User user) {
        return user.getRole() != null && user.getRole().getId() == ROLE_ADMIN;
    }

    public boolean isSupervisor(User user) {
        return user.getRole() != null && user.getRole().getId() == ROLE_SUPERVISOR;
    }

    public boolean isEmployee(User user) {
        return user.getRole() != null && user.getRole().getId() == ROLE_EMPLOYEE;
    }

    public boolean isManager(User user) {
        return user.getRole() != null && user.getRole().getId() == ROLE_MANAGER;
    }

    /**
     * Check if user has elevated access (Admin, SP001, or Director).
     * These users can see data across all their permitted sites.
     */
    public boolean hasElevatedAccess(User user) {
        return isAdmin(user) || isSP001(user) || isDirector(user);
    }

    // ========== TARGET EMPLOYEE VALIDATION ==========

    /**
     * Validate access to a target employee.
     * 403 if the current user cannot access this employee's data.
     * 
     * Rules:
     * - Users can always access their own data.
     * - SP001, Admin, Director can access any employee.
     * - SP002 can access any employee (operational only).
     * - Supervisor can access employees in their sites.
     * - Manager can access employees in their sites.
     */
    public void validateTargetEmployee(User currentUser, User targetUser) {
        // Self-access always allowed
        if (currentUser.getId().equals(targetUser.getId())) {
            return;
        }

        // SP001, Admin, Director can access anyone
        if (isSP001(currentUser) || isAdmin(currentUser) || isDirector(currentUser)) {
            return;
        }

        // SP002 can access anyone (operational only)
        if (isSP002(currentUser)) {
            return;
        }

        // Check if current user has access to the target user's site
        String targetSiteCode = targetUser.getSiteCode();
        if (targetSiteCode != null && !targetSiteCode.isBlank()) {
            // Check if any of the target user's sites overlap with current user's permitted sites
            Set<String> targetSites = getPermittedSites(targetUser);
            Set<String> currentSites = getPermittedSites(currentUser);
            for (String site : targetSites) {
                if (currentSites.contains("ALL") || currentSites.contains(site.toUpperCase())) {
                    return;
                }
            }
        }

        throw new ForbiddenException("Access denied to employee: " + targetUser.getName());
    }

    /**
     * Resolve a target user by ID and validate access.
     */
    public User resolveAndValidateTargetUser(HttpServletRequest request, Long targetUserId) {
        User currentUser = resolveUser(request);
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ForbiddenException("Target user not found"));
        validateTargetEmployee(currentUser, targetUser);
        return targetUser;
    }

    // ========== RECORD OWNERSHIP ==========

    /**
     * Validate that the current user can access a task.
     * Checks: self-assigned, reviewer, watcher, supervisor/manager of same site, or elevated.
     */
    public void validateTaskAccess(User currentUser, Task task) {
        if (task == null) {
            throw new ForbiddenException("Task not found");
        }

        // Task owner can access
        User assignedTo = task.getAssignedTo();
        if (assignedTo != null && assignedTo.getId().equals(currentUser.getId())) {
            return;
        }

        // Reviewer can access
        User reviewer = task.getReviewer();
        if (reviewer != null && reviewer.getId().equals(currentUser.getId())) {
            return;
        }

        // Watcher can access
        if (task.getWatchers() != null) {
            boolean isWatcher = task.getWatchers().stream()
                    .anyMatch(w -> w.getId().equals(currentUser.getId()));
            if (isWatcher) {
                return;
            }
        }

        // SP001, Admin, Director can access any task
        if (isSP001(currentUser) || isAdmin(currentUser) || isDirector(currentUser)) {
            return;
        }

        // SP002 can access any task (operational)
        if (isSP002(currentUser)) {
            return;
        }

        // Supervisor/Manager can access tasks assigned to employees in their sites
        if (assignedTo != null && (isSupervisor(currentUser) || isManager(currentUser))) {
            String assignedSite = assignedTo.getSiteCode();
            if (assignedSite != null && !assignedSite.isBlank()) {
                Set<String> targetSites = getPermittedSites(assignedTo);
                Set<String> currentSites = getPermittedSites(currentUser);
                for (String site : targetSites) {
                    if (currentSites.contains("ALL") || currentSites.contains(site.toUpperCase())) {
                        return;
                    }
                }
            }
        }

        throw new ForbiddenException("Access denied to task: " + task.getId());
    }

    /**
     * Resolve a task and validate access.
     * Used by TaskComment, TaskAttachment, ChangeRequest, Review controllers
     * to validate access via the parent task.
     */
    public void validateTaskAccessById(User currentUser, Long taskId,
            com.company.taskmanagement.repository.TaskRepository taskRepository) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ForbiddenException("Task not found: " + taskId));
        validateTaskAccess(currentUser, task);
    }

    // ========== DIRECTOR DASHBOARD ACCESS ==========

    /**
     * Validate that the current user can access Director Dashboard.
     * Only SP001 and Director role can access.
     */
    public void validateDirectorDashboardAccess(User currentUser) {
        if (!isSP001(currentUser) && !isDirector(currentUser)) {
            throw new ForbiddenException("Access denied to Director Dashboard");
        }
    }

    // ========== FILTERING HELPERS ==========

    /**
     * Filter a list of users to only those accessible by the current user.
     */
    public List<User> filterUsersByAccess(User currentUser, List<User> allUsers) {
        // SP001, Admin, Director see all
        if (isSP001(currentUser) || isAdmin(currentUser) || isDirector(currentUser)) {
            return allUsers;
        }
        // SP002 sees all (operational only - no director confidential)
        if (isSP002(currentUser)) {
            return allUsers;
        }
        // Others see only users in their permitted sites
        Set<String> permittedSites = getPermittedSites(currentUser);
        if (permittedSites.contains("ALL")) {
            return allUsers;
        }
        return allUsers.stream()
                .filter(u -> u.getSiteCode() != null)
                .filter(u -> {
                    Set<String> userSites = getPermittedSites(u);
                    for (String site : userSites) {
                        if (permittedSites.contains(site.toUpperCase())) {
                            return true;
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    /**
     * Filter a list of tasks to only those accessible by the current user.
     * Uses the assignedTo user's site_code for site-based filtering.
     */
    public List<Task> filterTasksByAccess(User currentUser, List<Task> allTasks) {
        // Elevated users see all
        if (hasElevatedAccess(currentUser)) {
            return allTasks;
        }
        // SP002 sees all operational
        if (isSP002(currentUser)) {
            return allTasks;
        }
        // Filter by tasks assigned to the user or users in their permitted sites
        Set<String> permittedSites = getPermittedSites(currentUser);
        if (permittedSites.contains("ALL")) {
            return allTasks;
        }
        return allTasks.stream()
                .filter(t -> {
                    User assigned = t.getAssignedTo();
                    if (assigned == null) {
                        return false;
                    }
                    // User's own tasks
                    if (assigned.getId().equals(currentUser.getId())) {
                        return true;
                    }
                    // Tasks assigned to users in permitted sites
                    String assignedSite = assigned.getSiteCode();
                    if (assignedSite != null && !assignedSite.isBlank()) {
                        Set<String> targetSites = getPermittedSites(assigned);
                        for (String site : targetSites) {
                            if (permittedSites.contains(site.toUpperCase())) {
                                return true;
                            }
                        }
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }
}

