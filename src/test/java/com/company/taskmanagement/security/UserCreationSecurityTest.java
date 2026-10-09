package com.company.taskmanagement.security;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.company.taskmanagement.controller.UserController;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.exception.ForbiddenException;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class UserCreationSecurityTest {

    @Mock
    private AccessService accessService;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void normalEmployeeCannotCreateUsers() {
        User employee = new User();
        User newUser = new User();

        when(accessService.resolveUser(request))
                .thenReturn(employee);

        assertThrows(
                ForbiddenException.class,
                () -> userController.saveUser(newUser, request)
        );

        verify(userService, never()).saveUser(any(User.class));
    }

    @org.junit.jupiter.api.Test
    void supervisorCannotCreateDirectorRole() {
        User supervisor = new User();
        User newUser = new User();

        newUser.setSiteCode("SITE001");

        com.company.taskmanagement.entity.Role directorRole =
                new com.company.taskmanagement.entity.Role();
        directorRole.setRoleName("DIRECTOR");
        newUser.setRole(directorRole);

        com.company.taskmanagement.entity.Role employeeRole =
                new com.company.taskmanagement.entity.Role();
        employeeRole.setRoleName("EMPLOYEE");

        when(accessService.resolveUser(request)).thenReturn(supervisor);
        when(accessService.isSupervisor(supervisor)).thenReturn(true);
        when(accessService.hasElevatedAccess(supervisor)).thenReturn(false);

        org.springframework.test.util.ReflectionTestUtils.setField(
                userController,
                "roleRepository",
                org.mockito.Mockito.mock(
                        com.company.taskmanagement.repository.RoleRepository.class
                )
        );

        com.company.taskmanagement.repository.RoleRepository roleRepository =
                (com.company.taskmanagement.repository.RoleRepository)
                org.springframework.test.util.ReflectionTestUtils.getField(
                        userController, "roleRepository"
                );

        when(roleRepository.findByRoleName("EMPLOYEE"))
                .thenReturn(employeeRole);

        when(userService.saveUser(newUser)).thenReturn(newUser);

        userController.addEmployee(newUser, request);

        org.junit.jupiter.api.Assertions.assertEquals(
                "EMPLOYEE",
                newUser.getRole().getRoleName()
        );

        verify(accessService, times(1)).validateSiteAccess(supervisor, "SITE001");
        verify(userService).saveUser(newUser);
    }

    @Test
    void managerCannotCreateEmployeeAtUnauthorizedSite() {
        User manager = new User();
        User newUser = new User();
        newUser.setSiteCode("OTHER_SITE");

        when(accessService.resolveUser(request)).thenReturn(manager);
        when(accessService.isManager(manager)).thenReturn(true);
        when(accessService.hasElevatedAccess(manager)).thenReturn(false);

        doThrow(new ForbiddenException("Access denied to site: OTHER_SITE"))
                .when(accessService)
                .validateSiteAccess(manager, "OTHER_SITE");

        assertThrows(
                ForbiddenException.class,
                () -> userController.addEmployee(newUser, request)
        );

        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void sp002CanCreateOnlyEmployeeRole() {
        User sp002 = new User();
        sp002.setEmployeeId("SP002");

        User newUser = new User();
        newUser.setSiteCode("SITE001");

        com.company.taskmanagement.entity.Role directorRole =
                new com.company.taskmanagement.entity.Role();
        directorRole.setRoleName("DIRECTOR");
        newUser.setRole(directorRole);

        com.company.taskmanagement.entity.Role employeeRole =
                new com.company.taskmanagement.entity.Role();
        employeeRole.setRoleName("EMPLOYEE");

        com.company.taskmanagement.repository.RoleRepository roleRepository =
                mock(com.company.taskmanagement.repository.RoleRepository.class);

        org.springframework.test.util.ReflectionTestUtils.setField(
                userController, "roleRepository", roleRepository);

        when(accessService.resolveUser(request)).thenReturn(sp002);
        when(accessService.isSP002(sp002)).thenReturn(true);
        when(accessService.hasElevatedAccess(sp002)).thenReturn(false);
        when(roleRepository.findByRoleName("EMPLOYEE"))
                .thenReturn(employeeRole);
        when(userService.saveUser(newUser)).thenReturn(newUser);

        userController.addEmployee(newUser, request);

        org.junit.jupiter.api.Assertions.assertEquals(
                "EMPLOYEE", newUser.getRole().getRoleName());

        verify(accessService).validateSiteAccess(sp002, "SITE001");
        verify(userService).saveUser(newUser);
    }

    @Test
    void supervisorCannotCreateEmployeeWithoutSite() {
        User supervisor = new User();
        User newUser = new User();

        when(accessService.resolveUser(request)).thenReturn(supervisor);
        when(accessService.isSupervisor(supervisor)).thenReturn(true);
        when(accessService.hasElevatedAccess(supervisor)).thenReturn(false);

        assertThrows(
                ForbiddenException.class,
                () -> userController.addEmployee(newUser, request)
        );

        verify(userService, never()).saveUser(any(User.class));
    }
}