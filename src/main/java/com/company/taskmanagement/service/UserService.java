package com.company.taskmanagement.service;

import java.io.InputStream;
import java.util.List;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

	// Normal user save karne ke liye
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

		return userRepository.save(user);
	}

	// Sabhi users lane ke liye
	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	// Login
	public User login(
			String employeeId,
			String email,
			String password) {

		if (employeeId == null
				|| email == null
				|| password == null) {

			throw new RuntimeException(
					"Employee ID, Email and Password are required"
			);
		}

		User user =
				userRepository.findByEmployeeIdAndEmailAndPassword(
						employeeId.trim(),
						email.trim(),
						password.trim()
				);

		if (user == null) {
			throw new RuntimeException(
					"Invalid Employee ID, Email or Password"
			);
		}

		if ("RESIGNED".equalsIgnoreCase(user.getStatus())) {
			throw new RuntimeException(
					"This employee account is resigned"
			);
		}

		return user;
	}

	// Employee resign karne ke liye
	public User resignEmployee(Long userId) {

		User user = userRepository.findById(userId)
				.orElseThrow(() ->
						new RuntimeException("User Not Found"));

		user.setStatus("RESIGNED");

		return userRepository.save(user);
	}

	public User getUserById(Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("User Not Found"));
	}

	// Excel import method
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

			/*
			 * Excel columns:
			 *
			 * Column 0 = NAME
			 * Column 1 = EMP ID
			 * Column 2 = DEPARTMENT
			 * Column 3 = MOBILE NO.
			 * Column 4 = DOJ
			 * Column 5 = DESIGNATION
			 * Column 6 = GENDER
			 * Column 7 = MAIL ID
			 * Column 8 = DOB
			 *
			 * Row 0 = Header
			 * Row 1 = Blank
			 * Row 2 se employee data start
			 */

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

				// Completely blank row skip
				if (name.isBlank()
						&& employeeId.isBlank()
						&& department.isBlank()
						&& contactNo.isBlank()
						&& email.isBlank()) {

					continue;
				}

				// Employee ID blank ho to row skip
				if (employeeId.isBlank()) {

					skippedRows++;

					System.out.println(
							"Skipped Excel row "
							+ (rowIndex + 1)
							+ ": Employee ID missing"
					);

					continue;
				}

				// Name blank ho to row skip
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

				User user =
						userRepository.findByEmployeeId(employeeId);

				boolean isNewEmployee = user == null;

				if (isNewEmployee) {

					user = new User();

					user.setEmployeeId(employeeId);

					// Default password
					user.setPassword(
							employeeId + "@123"
					);

					user.setStatus("ACTIVE");

					user.setRole(employeeRole);
				}

				// Name update
				user.setName(name.trim());

				// Department update
				if (!department.isBlank()) {
					user.setDepartment(
							department.trim()
					);
				}

				// Contact number update
				if (!contactNo.isBlank()) {
					user.setContactNo(
							cleanContactNumber(contactNo)
					);
				}

				// Email update
				if (!email.isBlank()) {
					user.setEmail(
							email.trim().toLowerCase()
					);
				}

				// Existing user ka role blank ho
				if (user.getRole() == null) {
					user.setRole(employeeRole);
				}

				// Existing user ka status blank ho
				if (user.getStatus() == null
						|| user.getStatus().isBlank()) {

					user.setStatus("ACTIVE");
				}

				// Existing user ka password blank ho
				if (user.getPassword() == null
						|| user.getPassword().isBlank()) {

					user.setPassword(
							employeeId + "@123"
					);
				}

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

	// Excel cell ki value read karne ke liye
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

	// Contact number clean karne ke liye
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
}