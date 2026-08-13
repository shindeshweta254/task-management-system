package com.company.taskmanagement.controller;


import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.UserRepository;
import com.company.taskmanagement.service.AccessService;
import com.company.taskmanagement.service.TaskService;

import jakarta.servlet.http.HttpServletRequest;



@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176"
})
@RestController
@RequestMapping("/api/tasks")
public class TasController {


    @Autowired
    private TaskService taskService;


    @Autowired
    private AccessService accessService;

    @Autowired
    private UserRepository userRepository;


    @PostMapping
    public Task saveTask(
            @RequestBody Task task,
            HttpServletRequest request
    ){

        accessService.resolveUser(request);

        return taskService.saveTask(task);

    }



    @PutMapping("/{taskId}/{status}")
    public Task updateTaskStatus(
            @PathVariable Long taskId,
            @PathVariable String status,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService.updateTaskStatus(
                taskId,
                status
        );

    }

    @GetMapping("/employee/{userId}")
    public List<Task> getTasksByEmployee(
            @PathVariable("userId") Long userId,
            HttpServletRequest request
    ){

        // 1. Prefer the authenticated JWT user from the SecurityContext.
        User authenticatedUser =
                resolveUserFromSecurityContext();

        if (authenticatedUser != null) {

            // An authenticated employee may only view their OWN tasks.
            if (authenticatedUser.getId().equals(userId)) {
                return taskService
                        .getTasksByEmployee(userId);
            }

            // Supervisors / managers / elevated roles may view site employees' tasks.
            if (accessService.isDirector(authenticatedUser)
                    || accessService.isSP001(authenticatedUser)
                    || accessService.isSP002(authenticatedUser)
                    || accessService.isAdmin(authenticatedUser)
                    || accessService.isSupervisor(authenticatedUser)
                    || accessService.isManager(authenticatedUser)
                    || accessService.hasElevatedAccess(authenticatedUser)
                    || accessService.isGlobalSupervisor(authenticatedUser)) {

                return taskService
                        .getTasksByEmployee(userId);
            }

            throw new com.company.taskmanagement.exception.ForbiddenException(
                    "Access denied to tasks of employee: " + userId);
        }

        // 2. Backward-compatible fallback: X-User-Id header.
        accessService
                .resolveAndValidateTargetUser(
                        request,
                        userId
                );


        return taskService
                .getTasksByEmployee(userId);

    }

    /**
     * Resolve the current logged-in user from the JWT SecurityContext.
     * Returns null when no authenticated user is present.
     */
    private User resolveUserFromSecurityContext() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || "anonymousUser"
                        .equals(auth.getPrincipal())) {
            return null;
        }

        Object principal = auth.getPrincipal();

        String employeeId = null;

        if (principal instanceof UserDetails userDetails) {
            employeeId = userDetails.getUsername();
        } else if (principal instanceof String) {
            employeeId = (String) principal;
        }

        if (employeeId == null || employeeId.isBlank()) {
            return null;
        }

        List<User> users = userRepository.findByEmployeeId(employeeId);
        if (users == null || users.isEmpty()) {
            return null;
        }
        return users.get(0);
    }



    /*
     * FINAL ROLE BASED TASK ACCESS
     *
     * Director  -> ALL
     * SP001     -> ALL
     * Supervisor-> SITE WISE
     * Employee  -> OWN TASK
     */

    @GetMapping("/all")
    public List<Task> getAllTasks(
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);



        // Director + SP001

        if(accessService.isDirector(currentUser)
                ||
           accessService.isSP001(currentUser)
        ){

            return taskService.getAllTasks();

        }


        // Supervisor

        if(currentUser.getRole()!=null
                &&
           "SUPERVISOR"
           .equalsIgnoreCase(
              currentUser.getRole().getRoleName()
           )
        ){

            return taskService
                    .getSupervisorSiteTasks(
                            currentUser
                    );

        }


        return taskService
                .getTasksByEmployee(
                        currentUser.getId()
                );

    }

    @GetMapping("/count/total")
    public long totalTasks(
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        List<Task> tasks;


        if(accessService.isDirector(currentUser)
                ||
           accessService.isSP001(currentUser)
        ){

            tasks =
              taskService.getAllTasks();

        }
        else if(
          currentUser.getRole()!=null
          &&
          "SUPERVISOR".equalsIgnoreCase(
          currentUser.getRole().getRoleName())
        ){

            tasks =
              taskService.getSupervisorSiteTasks(
                      currentUser
              );

        }
        else{

            tasks =
              taskService.getTasksByEmployee(
                      currentUser.getId()
              );

        }


        return tasks.size();

    }


    @GetMapping("/count/pending")
    public long pendingTasks(
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        return taskService
                .getPendingTasksList()
                .stream()
                .filter(task ->
                    accessService
                    .filterTasksByAccess(
                            currentUser,
                            List.of(task)
                    )
                    .size()>0
                )
                .count();

    }


    @GetMapping("/count/completed")
    public long completedTasks(
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);



        return taskService
                .getCompletedTasksList()
                .stream()
                .filter(task ->
                    accessService
                    .filterTasksByAccess(
                            currentUser,
                            List.of(task)
                    )
                    .size()>0
                )
                .count();

    }


    @DeleteMapping("/{taskId}")
    public String deleteTask(
            @PathVariable Long taskId,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        taskService.deleteTask(taskId);


        return "Task Deleted Successfully";

    }

    @PutMapping("/progress/{taskId}/{progress}")
    public Task updateProgress(
            @PathVariable Long taskId,
            @PathVariable Integer progress,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService.updateProgress(
                taskId,
                progress
        );

    }


    @GetMapping("/deadline-today")
    public long deadlineToday(
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        return taskService
                .getAllTasks()
                .stream()
                .filter(task ->

                    task.getDueDate()!=null
                    &&
                    task.getDueDate()
                    .equals(
                    java.time.LocalDate.now()
                    )

                )
                .filter(task ->
                    accessService
                    .filterTasksByAccess(
                            currentUser,
                            List.of(task)
                    )
                    .size()>0
                )
                .count();

    }

    @GetMapping("/available")
    public List<Task> getAvailableTasks(
            HttpServletRequest request
    ){

        accessService.resolveUser(request);

        return taskService.getAvailableTasks();

    }


    @PostMapping("/take/{taskId}/{userId}")
    public Task takeTask(
            @PathVariable Long taskId,
            @PathVariable Long userId,
            HttpServletRequest request
    ){

        accessService
                .resolveAndValidateTargetUser(
                        request,
                        userId
                );


        return taskService.takeTask(
                taskId,
                userId
        );

    }


    @PutMapping("/approve/{taskId}")
    public Task approveTask(
            @PathVariable Long taskId,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService.updateTaskStatus(
                taskId,
                "APPROVED"
        );

    }


    @PutMapping("/changes/{taskId}")
    public Task changesRequested(
            @PathVariable Long taskId,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService.updateTaskStatus(
                taskId,
                "CHANGES_REQUESTED"
        );

    }


    @PostMapping("/{taskId}/watchers/{userId}")
    public Task addWatcher(
            @PathVariable Long taskId,
            @PathVariable Long userId,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService.addWatcher(
                taskId,
                userId
        );

    }

    @GetMapping("/{taskId}/watchers")
    public List<UserDTO> getWatchers(
            @PathVariable Long taskId,
            HttpServletRequest request
    ){

        User currentUser =
                accessService.resolveUser(request);


        Task task =
                taskService.getTaskById(taskId);


        accessService.validateTaskAccess(
                currentUser,
                task
        );


        return taskService
                .getWatchers(taskId)
                .stream()
                .map(UserDTO::fromUser)
                .collect(Collectors.toList());

    }
   
}