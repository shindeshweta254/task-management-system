package com.company.taskmanagement.migration;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("migration")
public class MigrationRunner implements CommandLineRunner {

    private final DatabaseMigrationService databaseMigrationService;

    public MigrationRunner(DatabaseMigrationService databaseMigrationService) {
        this.databaseMigrationService = databaseMigrationService;
    }

    @Override
    public void run(String... args) throws Exception {
        databaseMigrationService.migratePasswords();
    }
}
