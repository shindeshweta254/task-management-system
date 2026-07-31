package com.company.taskmanagement.service;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.company.taskmanagement.entity.Notification;
import com.company.taskmanagement.entity.Task;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.NotificationRepository;
import com.company.taskmanagement.repository.TaskRepository;
import com.company.taskmanagement.repository.UserRepository;



@Service
public class TaskService {


    @Autowired
    private TaskRepository taskRepository;


    @Autowired
    private UserRepository userRepository;


    @Autowired
    private NotificationRepository notificationRepository;





    public Task getTaskById(Long taskId){

        return taskRepository.findById(taskId)
                .orElseThrow(() ->
                    new RuntimeException("Task Not Found")
                );

    }







    public Task saveTask(Task task){


        Task savedTask =
                taskRepository.save(task);



        if(task.getAssignedTo()!=null){


            createNotification(
                    task.getAssignedTo(),
                    savedTask,
                    "A manager assigned you a new task: "
                    + task.getTaskTitle()
            );

        }


        return savedTask;

    }








    public Task takeTask(
            Long taskId,
            Long userId
    ){


        Task task =
                getTaskById(taskId);



        User user =
                userRepository.findById(userId)
                .orElseThrow(() ->
                    new RuntimeException(
                        "User Not Found"
                    )
                );



        task.setAssignedTo(user);



        Task savedTask =
                taskRepository.save(task);



        createNotification(
                user,
                savedTask,
                "You have been assigned a new task: "
                + task.getTaskTitle()
        );



        return savedTask;

    }









    private void createNotification(
            User user,
            Task task,
            String message
    ){


        try{


            Notification notification =
                    new Notification();


            notification.setUserId(
                    user.getId()
            );


            notification.setTitle(
                    "New Task Assigned"
            );


            notification.setMessage(
                    message
            );


            notification.setType(
                    "TASK_ASSIGNED"
            );


            notification.setTaskId(
                    task.getId()
            );


            notification.setRead(false);


            notification.setCreatedAt(
                    LocalDateTime.now()
            );



            notificationRepository.save(
                    notification
            );


        }
        catch(Exception e){


            System.err.println(
                "Notification Error : "
                + e.getMessage()
            );

        }


    }









    public List<Task> getAllTasks(){

        return taskRepository.findAll();

    }







    public List<Task> getTasksByEmployee(
            Long userId
    ){

        return taskRepository
                .findByAssignedToId(userId);

    }








    public Task updateTaskStatus(
            Long taskId,
            String status
    ){


        Task task =
                getTaskById(taskId);



        task.setStatus(status);



        return taskRepository.save(task);

    }








    public void deleteTask(Long taskId){

        taskRepository.deleteById(taskId);

    }








    public Task updateProgress(
            Long taskId,
            Integer progress
    ){


        Task task =
                getTaskById(taskId);


        task.setProgressPercentage(
                progress
        );


        return taskRepository.save(task);

    }









    public List<Task> getAvailableTasks(){

        return taskRepository
                .findByAssignedToIsNull();

    }









    public List<Task> getPendingTasksList(){

        return taskRepository
                .findByStatus("PENDING");

    }







    public List<Task> getCompletedTasksList(){

        return taskRepository
                .findByStatus("COMPLETED");

    }










    public Task addWatcher(
            Long taskId,
            Long userId
    ){


        Task task =
                getTaskById(taskId);



        User user =
                userRepository.findById(userId)
                .orElseThrow(() ->
                    new RuntimeException(
                        "User Not Found"
                    )
                );



        task.getWatchers()
            .add(user);



        return taskRepository.save(task);

    }








    public List<User> getWatchers(
            Long taskId
    ){

        return getTaskById(taskId)
                .getWatchers();

    }









    public long getEmployeeTotalTasks(
            Long userId
    ){

        return taskRepository
                .countByAssignedToId(
                        userId
                );

    }









    public long getEmployeePendingTasks(
            Long userId
    ){

        return taskRepository
                .countByAssignedToIdAndStatus(
                        userId,
                        "PENDING"
                );

    }









    public long getEmployeeCompletedTasks(
            Long userId
    ){

        return taskRepository
                .countByAssignedToIdAndStatus(
                        userId,
                        "COMPLETED"
                );

    }









    public long getEmployeeDeadlineTasks(
            Long userId
    ){


        return taskRepository
                .findByAssignedToId(userId)
                .stream()
                .filter(task ->

                    task.getDueDate()!=null
                    &&
                    task.getDueDate()
                    .isBefore(
                        LocalDate.now()
                    )
                    &&
                    !"COMPLETED"
                    .equals(task.getStatus())

                )
                .count();

    }









    /*
     * SUPERVISOR SITE FILTER
     *
     * ALL
     * SINGLE SITE
     * MULTIPLE SITE
     */


    public List<Task> getSupervisorSiteTasks(
            User supervisor
    ){


        String siteCode =
                supervisor.getSiteCode();



        if(siteCode==null
                ||
           siteCode.isBlank()){


            throw new RuntimeException(
                    "Supervisor site code missing"
            );

        }





        // ALL SITE ACCESS

        if("ALL".equalsIgnoreCase(
                siteCode.trim()
        )){


            return taskRepository.findAll();

        }







        // MULTIPLE SITE

        if(siteCode.contains(",")){


            List<String> sites =
                    Arrays.stream(
                            siteCode.split(",")
                    )
                    .map(String::trim)
                    .toList();



            return taskRepository
                    .findByAssignedToSiteCodeIn(
                            sites
                    );

        }







        // SINGLE SITE

        return taskRepository
                .findByAssignedToSiteCode(
                        siteCode.trim()
                );


    }



}