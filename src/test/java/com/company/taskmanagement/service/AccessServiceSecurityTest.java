package com.company.taskmanagement.service;

import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AccessServiceSecurityTest {

    private final AccessService accessService = new AccessService();

    private User user(Long id, String employeeId, long roleId, String site) {
        Role role = new Role();
        role.setId(roleId);

        User user = new User();
        user.setId(id);
        user.setEmployeeId(employeeId);
        user.setRole(role);
        user.setSiteCode(site);
        user.setStatus("ACTIVE");

        return user;
    }

    @Test
    void employeeCanAccessOwnRecord() {
        User employee = user(1L, "EMP001", 3L, "SITE_A");

        assertDoesNotThrow(() ->
                accessService.validateTargetEmployee(employee, employee));
    }

    @Test
    void supervisorCanAccessOwnSite() {
        User supervisor = user(2L, "SUP001", 10L, "SITE_A");
        User employee = user(3L, "EMP002", 3L, "SITE_A");

        assertDoesNotThrow(() ->
                accessService.validateTargetEmployee(supervisor, employee));
    }

    @Test
    void supervisorCannotAccessDifferentSite() {
        User supervisor = user(2L, "SUP001", 10L, "SITE_A");
        User employee = user(3L, "EMP002", 3L, "SITE_B");

        assertThrows(ForbiddenException.class, () ->
                accessService.validateTargetEmployee(supervisor, employee));
    }

    @Test
    void directorCanAccessAllSites() {
        User director = user(4L, "DIR001", 4L, "SITE_A");
        User employee = user(5L, "EMP003", 3L, "SITE_B");

        assertDoesNotThrow(() ->
                accessService.validateTargetEmployee(director, employee));
    }

    @Test
    void sp001CanAccessAllSites() {
        User special = user(6L, "SP001", 10L, "SITE_A");
        User employee = user(7L, "EMP004", 3L, "SITE_B");

        assertDoesNotThrow(() ->
                accessService.validateTargetEmployee(special, employee));
    }

    @Test
    void sp002CanAccessAllSites() {
        User special = user(8L, "SP002", 10L, "SITE_A");
        User employee = user(9L, "EMP005", 3L, "SITE_B");

        assertDoesNotThrow(() ->
                accessService.validateTargetEmployee(special, employee));
    }

    @Test
    void employeeCannotAccessDifferentSite() {
        User employee1 = user(10L, "EMP006", 3L, "SITE_A");
        User employee2 = user(11L, "EMP007", 3L, "SITE_B");

        assertThrows(ForbiddenException.class, () ->
                accessService.validateTargetEmployee(employee1, employee2));
    }

    private com.company.taskmanagement.entity.Task task(
            Long id, User assignedTo) {
        com.company.taskmanagement.entity.Task task =
                new com.company.taskmanagement.entity.Task();
        task.setId(id);
        task.setAssignedTo(assignedTo);
        return task;
    }

    @Test
    void assignedEmployeeCanAccessOwnTask() {
        User employee = user(20L, "EMP020", 3L, "SITE_A");
        assertDoesNotThrow(() ->
                accessService.validateTaskAccess(
                        employee, task(100L, employee)));
    }

    @Test
    void employeeCannotAccessOtherEmployeesTaskOnSameSite() {
        User employee1 = user(21L, "EMP021", 3L, "SITE_A");
        User employee2 = user(22L, "EMP022", 3L, "SITE_A");

        assertThrows(ForbiddenException.class, () ->
                accessService.validateTaskAccess(
                        employee1, task(101L, employee2)));
    }

    @Test
    void reviewerCanAccessAssignedReviewTask() {
        User reviewer = user(23L, "EMP023", 3L, "SITE_A");
        User assignee = user(24L, "EMP024", 3L, "SITE_B");

        var task = task(102L, assignee);
        task.setReviewer(reviewer);

        assertDoesNotThrow(() ->
                accessService.validateTaskAccess(reviewer, task));
    }

    @Test
    void watcherCanAccessWatchedTask() {
        User watcher = user(25L, "EMP025", 3L, "SITE_A");
        User assignee = user(26L, "EMP026", 3L, "SITE_B");

        var task = task(103L, assignee);
        task.setWatchers(java.util.List.of(watcher));

        assertDoesNotThrow(() ->
                accessService.validateTaskAccess(watcher, task));
    }

    @Test
    void supervisorCanAccessTaskFromOwnSite() {
        User supervisor = user(27L, "SUP027", 10L, "SITE_A");
        User assignee = user(28L, "EMP028", 3L, "SITE_A");

        assertDoesNotThrow(() ->
                accessService.validateTaskAccess(
                        supervisor, task(104L, assignee)));
    }

    @Test
    void supervisorCannotAccessTaskFromDifferentSite() {
        User supervisor = user(29L, "SUP029", 10L, "SITE_A");
        User assignee = user(30L, "EMP030", 3L, "SITE_B");

        assertThrows(ForbiddenException.class, () ->
                accessService.validateTaskAccess(
                        supervisor, task(105L, assignee)));
    }

    @Test
    void directorCanAccessTaskFromAnySite() {
        User director = user(31L, "DIR031", 4L, "SITE_A");
        User assignee = user(32L, "EMP032", 3L, "SITE_B");

        assertDoesNotThrow(() ->
                accessService.validateTaskAccess(
                        director, task(106L, assignee)));
    }

    @Test
    void nullTaskIsDenied() {
        User employee = user(33L, "EMP033", 3L, "SITE_A");

        assertThrows(ForbiddenException.class, () ->
                accessService.validateTaskAccess(employee, null));
    }

    @Test
    void sp002CanAccessAssignedSitesButNotOtherSites() {
        User sp002 = user(20L, "SP002", 10L, "SITE001,SITE002");

        assertTrue(accessService.hasSiteAccess(sp002, "SITE001"));
        assertTrue(accessService.hasSiteAccess(sp002, "site_002"));
        assertFalse(accessService.hasSiteAccess(sp002, "SITE003"));

        assertThrows(ForbiddenException.class, () ->
                accessService.validateSiteAccess(sp002, "SITE003"));
    }

    @Test
    void managerCanAccessAssignedSitesButNotOtherSites() {
        User manager = user(21L, "MGR001", 2L, "SITE001,SITE002");

        assertTrue(accessService.hasSiteAccess(manager, "SITE001"));
        assertTrue(accessService.hasSiteAccess(manager, "site_002"));
        assertFalse(accessService.hasSiteAccess(manager, "SITE003"));

        assertThrows(ForbiddenException.class, () ->
                accessService.validateSiteAccess(manager, "SITE003"));
    }
}
