package com.company.taskmanagement.migration;

import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DatabaseMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);
    private static final Pattern BCRYPT_PATTERN = Pattern.compile("\\A\\$2[ayb]\\$\\d{2}\\$[./A-Za-z0-9]{53}");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseMigrationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void migratePasswords() {
        logger.info("Starting password migration check...");

        List<User> allUsers = userRepository.findAll();
        
        List<User> usersToMigrate = allUsers.stream()
                .filter(user -> user.getPassword() != null && !user.getPassword().isBlank())
                .filter(user -> !BCRYPT_PATTERN.matcher(user.getPassword()).matches())
                .collect(Collectors.toList());

        if (usersToMigrate.isEmpty()) {
            logger.info("Password migration not needed. All relevant passwords seem to be hashed already.");
            return;
        }

        logger.info("Found {} users whose passwords need to be migrated.", usersToMigrate.size());

        int migratedCount = 0;
        for (User user : usersToMigrate) {
            try {
                String plainTextPassword = user.getPassword();
                String hashedPassword = passwordEncoder.encode(plainTextPassword);
                user.setPassword(hashedPassword);
                userRepository.save(user);
                migratedCount++;
                logger.info("Successfully migrated password for user ID: {}", user.getId());
            } catch (Exception e) {
                logger.error("Failed to migrate password for user ID: {}. Error: {}", user.getId(), e.getMessage());
            }
        }

        logger.info("Password migration complete. {} users were updated.", migratedCount);
    }
}
