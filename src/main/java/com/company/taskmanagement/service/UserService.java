package com.company.taskmanagement.service;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.company.taskmanagement.dto.UserDTO;
import com.company.taskmanagement.entity.Role;
import com.company.taskmanagement.entity.User;
import com.company.taskmanagement.repository.RoleRepository;
import com.company.taskmanagement.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;


    // =========================================================
    // SAVE USER
    // =========================================================

    public User saveUser(User user) {

        if (user.getRole() != null
                && user.getRole().getRoleName() != null) {

            String roleName = user.getRole()
                    .getRoleName()
                    .trim()
                    .toUpperCase();

            Role role = roleRepository.findByRoleName(roleName);

            if (role == null) {
                throw new RuntimeException(
                        "Role not found: " + roleName
                );
            }

            user.setRole(role);
        }

        /*
         * PASSWORD SECURITY REMOVED
         *
         * Password ko encode ya verify nahi kiya jayega.
         */

        return userRepository.save(user);
    }


    // =========================================================
    // GET ALL USERS
    // =========================================================

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }


    // =========================================================
    // RESIGN EMPLOYEE
    // =========================================================

    public User resignEmployee(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User Not Found")
                );

        user.setStatus("RESIGNED");

        return userRepository.save(user);
    }


    // =========================================================
    // GET USER BY ID
    // =========================================================

    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User Not Found")
                );
    }


    // =========================================================
    // FIND USER BY EMPLOYEE ID
    // =========================================================

    public User findUserByEmployeeId(String employeeId) {

        List<User> users =
                userRepository.findByEmployeeId(employeeId);

        return users.isEmpty()
                ? null
                : users.get(0);
    }


    // =========================================================
    // EXCEL IMPORT
    // =========================================================

    public String importStaffFromExcel(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException(
                    "Please select a valid Excel file"
            );
        }

        int newEmployees = 0;
        int updatedEmployees = 0;
        int skippedRows = 0;

        DataFormatter formatter = new DataFormatter();

        try (
                InputStream inputStream = file.getInputStream();
                Workbook workbook =
                        WorkbookFactory.create(inputStream)
        ) {

            Sheet sheet = workbook.getSheetAt(0);

            if (sheet == null) {
                throw new RuntimeException(
                        "Excel sheet not found"
                );
            }

            Role employeeRole =
                    roleRepository.findByRoleName("EMPLOYEE");

            if (employeeRole == null) {
                throw new RuntimeException(
                        "EMPLOYEE role database me nahi mila"
                );
            }

            for (
                    int rowIndex = 2;
                    rowIndex <= sheet.getLastRowNum();
                    rowIndex++
            ) {

                Row row = sheet.getRow(rowIndex);

                if (row == null) {
                    continue;
                }

                String name =
                        getCellValue(
                                row,
                                0,
                                formatter
                        );

                String employeeId =
                        getCellValue(
                                row,
                                1,
                                formatter
                        );

                String department =
                        getCellValue(
                                row,
                                2,
                                formatter
                        );

                String contactNo =
                        getCellValue(
                                row,
                                3,
                                formatter
                        );

                String email =
                        getCellValue(
                                row,
                                7,
                                formatter
                        );

                System.out.println(
                        "Excel Row: " + (rowIndex + 1)
                        + " | Name: [" + name + "]"
                        + " | Employee ID: [" + employeeId + "]"
                        + " | Mobile: [" + contactNo + "]"
                        + " | Email: [" + email + "]"
                );


                // Completely blank row
                if (name.isBlank()
                        && employeeId.isBlank()
                        && department.isBlank()
                        && contactNo.isBlank()
                        && email.isBlank()) {

                    continue;
                }


                // Employee ID missing
                if (employeeId.isBlank()) {

                    skippedRows++;

                    System.out.println(
                            "Skipped Excel row "
                            + (rowIndex + 1)
                            + ": Employee ID missing"
                    );

                    continue;
                }


                // Name missing
                if (name.isBlank()) {

                    skippedRows++;

                    System.out.println(
                            "Skipped Excel row "
                            + (rowIndex + 1)
                            + ": Employee name missing"
                    );

                    continue;
                }

                employeeId = employeeId.trim();


                // Find existing user
                List<User> users =
                        userRepository.findByEmployeeId(
                                employeeId
                        );

                User user = null;

                if (!users.isEmpty()) {
                    user = users.get(0);
                }

                boolean isNewEmployee = user == null;


                // =================================================
                // NEW EMPLOYEE
                // =================================================

                if (isNewEmployee) {

                    user = new User();

                    user.setEmployeeId(employeeId);

                    user.setStatus("ACTIVE");

                    user.setRole(employeeRole);

                    /*
                     * PASSWORD REMOVED
                     *
                     * No default password is created.
                     */
                }


                // =================================================
                // UPDATE USER DATA
                // =================================================

                user.setName(name.trim());


                if (!department.isBlank()) {

                    user.setDepartment(
                            department.trim()
                    );
                }


                if (!contactNo.isBlank()) {

                    user.setContactNo(
                            cleanContactNumber(contactNo)
                    );
                }


                if (!email.isBlank()) {

                    user.setEmail(
                            email.trim().toLowerCase()
                    );
                }


                // Role missing
                if (user.getRole() == null) {

                    user.setRole(employeeRole);
                }


                // Status missing
                if (user.getStatus() == null
                        || user.getStatus().isBlank()) {

                    user.setStatus("ACTIVE");
                }


                /*
                 * PASSWORD REMOVED
                 *
                 * Existing user ka password bhi
                 * generate/update nahi hoga.
                 */


                userRepository.save(user);


                if (isNewEmployee) {
                    newEmployees++;
                } else {
                    updatedEmployees++;
                }
            }


            return "Excel import successful. "
                    + "New employees: " + newEmployees
                    + ", Updated employees: "
                    + updatedEmployees
                    + ", Skipped rows: "
                    + skippedRows;


        } catch (Exception exception) {

            exception.printStackTrace();

            throw new RuntimeException(
                    "Excel import failed: "
                    + exception.getMessage(),
                    exception
            );
        }
    }


    // =========================================================
    // EXCEL CELL VALUE
    // =========================================================

    private String getCellValue(
            Row row,
            int columnIndex,
            DataFormatter formatter) {

        if (row == null
                || row.getCell(columnIndex) == null) {

            return "";
        }

        String value =
                formatter.formatCellValue(
                        row.getCell(columnIndex)
                );

        if (value == null) {
            return "";
        }

        return value.trim();
    }


    // =========================================================
    // CLEAN CONTACT NUMBER
    // =========================================================

    private String cleanContactNumber(String contactNo) {

        if (contactNo == null) {
            return "";
        }

        String cleanedContact =
                contactNo
                        .trim()
                        .replaceAll("\\s+", "")
                        .replace("-", "");

        if (cleanedContact.endsWith(".0")) {

            cleanedContact =
                    cleanedContact.substring(
                            0,
                            cleanedContact.length() - 2
                    );
        }

        return cleanedContact;
    }


    // =========================================================
    // GET USERS BY SITE
    // =========================================================

    public List<User> getUsersBySiteCode(String siteCode) {

        return userRepository.findBySiteCode(siteCode);
    }


    // =========================================================
    // SUPERVISOR EMPLOYEES
    // =========================================================

    public List<User> getSupervisorEmployees(Long userId) {

        User supervisor =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Supervisor not found"
                                )
                        );

        String siteCode = supervisor.getSiteCode();


        if (siteCode == null
                || siteCode.trim().isEmpty()) {

            throw new RuntimeException(
                    "Supervisor site code missing"
            );
        }


        if ("ALL".equalsIgnoreCase(siteCode.trim())) {

            return userRepository.findAll();
        }


        if (siteCode.contains(",")) {

            List<String> sites =
                    Arrays.stream(
                            siteCode.split(",")
                    )
                    .map(String::trim)
                    .filter(site -> !site.isEmpty())
                    .toList();

            return userRepository.findAll()
                    .stream()
                    .filter(user ->
                            user.getSiteCode() != null
                            && sites.stream().anyMatch(site ->
                                    site.equalsIgnoreCase(
                                            user.getSiteCode().trim()
                                    )
                            )
                    )
                    .toList();
        }


        return userRepository.findBySiteCode(
                siteCode.trim()
        );
    }


    // =========================================================
    // LOGIN
    // =========================================================
    //
    // PASSWORD COMPLETELY REMOVED
    //
    // Login only checks:
    // 1. Employee ID
    // 2. Email
    // 3. ACTIVE status
    //
    // =========================================================

    public UserDTO login(
            String employeeId,
            String email,
            String password) {

        System.out.println(
                "========== LOGIN DEBUG =========="
        );

        System.out.println(
                "Employee ID: [" + employeeId + "]"
        );

        System.out.println(
                "Email: [" + email + "]"
        );

        /*
         * Password intentionally ignored.
         */
        System.out.println(
                "Password authentication: DISABLED"
        );


        // ---------------------------------------------------------
        // EMPLOYEE ID VALIDATION
        // ---------------------------------------------------------

        if (employeeId == null
                || employeeId.trim().isEmpty()) {

            throw new RuntimeException(
                    "Employee ID is required"
            );
        }


        // ---------------------------------------------------------
        // EMAIL VALIDATION
        // ---------------------------------------------------------

        if (email == null
                || email.trim().isEmpty()) {

            throw new RuntimeException(
                    "Email is required"
            );
        }


        employeeId = employeeId.trim();
        email = email.trim();


        // ---------------------------------------------------------
        // FIND USER
        // ---------------------------------------------------------

        List<User> users =
                userRepository.findByEmployeeId(
                        employeeId
                );

        System.out.println(
                "Users found: " + users.size()
        );


        if (users.isEmpty()) {

            throw new RuntimeException(
                    "Invalid Employee ID"
            );
        }


        User user = users.get(0);


        // ---------------------------------------------------------
        // USER DETAILS
        // ---------------------------------------------------------

        System.out.println(
                "DB Employee ID: ["
                + user.getEmployeeId()
                + "]"
        );

        System.out.println(
                "DB Email: ["
                + user.getEmail()
                + "]"
        );

        System.out.println(
                "DB Status: ["
                + user.getStatus()
                + "]"
        );

        System.out.println(
                "DB Role: "
                + (
                    user.getRole() != null
                    ? user.getRole().getRoleName()
                    : "NULL"
                )
        );


        // ---------------------------------------------------------
        // STATUS CHECK
        // ---------------------------------------------------------

        if (user.getStatus() != null
                && !"ACTIVE".equalsIgnoreCase(
                        user.getStatus().trim()
                )) {

            throw new RuntimeException(
                    "Your account is not active. "
                    + "Please contact Administrator."
            );
        }


        // ---------------------------------------------------------
        // EMAIL CHECK
        // ---------------------------------------------------------

        if (user.getEmail() == null
                || !user.getEmail()
                        .trim()
                        .equalsIgnoreCase(email)) {

            System.out.println(
                    "EMAIL MISMATCH!"
            );

            throw new RuntimeException(
                    "Invalid Employee ID or email"
            );
        }


        // ---------------------------------------------------------
        // LOGIN SUCCESS
        // ---------------------------------------------------------

        System.out.println(
                "========== LOGIN SUCCESS =========="
        );

        System.out.println(
                "Password authentication: DISABLED"
        );


        return UserDTO.fromUser(user);
    }
}