package com.company.taskmanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.company.taskmanagement.entity.User;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;

@Service
public class FirebasePushService {

    @Autowired
    private UserService userService;

    public boolean sendToUser(
            Long userId,
            String title,
            String body,
            String type,
            Long taskId) {

        try {
            User user = userService.getUserById(userId);

            if (user == null) {
                System.out.println("FCM PUSH SKIPPED - user not found: " + userId);
                return false;
            }

            String fcmToken = user.getFcmToken();

            if (fcmToken == null || fcmToken.isBlank()) {
                System.out.println(
                        "FCM PUSH SKIPPED - no token for userId=" + userId
                );
                return false;
            }

            Message.Builder builder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(
                            Notification.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build()
                    );

            if (type != null) {
                builder.putData("type", type);
            }

            if (taskId != null) {
                builder.putData("taskId", String.valueOf(taskId));
            }

            String response =
                    FirebaseMessaging.getInstance().send(builder.build());

            System.out.println(
                    "FCM PUSH SENT userId=" + userId +
                    " response=" + response
            );

            return true;

        } catch (Exception e) {
            System.err.println(
                    "FCM PUSH ERROR userId=" + userId +
                    ": " + e.getMessage()
            );
            return false;
        }
    }
}