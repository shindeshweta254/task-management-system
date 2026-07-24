package com.company.taskmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.taskmanagement.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead);

    long countByUserIdAndIsRead(Long userId, boolean isRead);

    List<Notification> findByUserIdAndIsRead(Long userId, boolean isRead);

    // For deduplication: check if notification already exists for same user, task, and type
    List<Notification> findByUserIdAndTaskIdAndType(Long userId, Long taskId, String type);
}

