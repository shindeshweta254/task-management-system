package com.company.taskmanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.Notification;
import com.company.taskmanagement.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private FirebasePushService firebasePushService;

    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    public Notification createTaskAssignedNotification(Long userId, String assignerRole, String taskTitle, Long taskId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle("New Task Assigned");
        notification.setMessage(assignerRole + " assigned you a new task: " + taskTitle);
        notification.setType("TASK_ASSIGNED");
        notification.setTaskId(taskId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);

        firebasePushService.sendToUser(
                userId,
                saved.getTitle(),
                saved.getMessage(),
                saved.getType(),
                saved.getTaskId()
        );

        return saved;
    }

    public Notification createReportSubmittedNotification(
            Long userId,
            String employeeName,
            Long reportId) {

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle("New Report Submitted");
        notification.setMessage(employeeName + " submitted a new daily report.");
        notification.setType("REPORT_SUBMITTED");
        notification.setTaskId(null);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        firebasePushService.sendToUser(
                userId,
                saved.getTitle(),
                saved.getMessage(),
                saved.getType(),
                null
        );

        return saved;
    }
    public Notification createTaskReadyForReviewNotification(
            Long reviewerUserId,
            String employeeName,
            String taskTitle,
            Long taskId) {

        Notification notification = new Notification();
        notification.setUserId(reviewerUserId);
        notification.setTitle("Task Ready For Review");
        notification.setMessage(employeeName + " completed task: " + taskTitle);
        notification.setType("TASK_READY_FOR_REVIEW");
        notification.setTaskId(taskId);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        firebasePushService.sendToUser(
                reviewerUserId,
                saved.getTitle(),
                saved.getMessage(),
                saved.getType(),
                saved.getTaskId()
        );

        return saved;
    }
    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false);
    }

    public long getUnreadCountByUserId(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsReadByUserId(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsRead(userId, false);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }

    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    /**
     * Check if a notification already exists for the same user, task, and type (deduplication).
     */
    public boolean hasExistingNotification(Long userId, Long taskId, String type) {
        List<Notification> existing = notificationRepository.findByUserIdAndTaskIdAndType(userId, taskId, type);
        return existing != null && !existing.isEmpty();
    }
}

