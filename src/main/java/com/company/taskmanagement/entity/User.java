package com.company.taskmanagement.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "employee_id", unique = true)
	private String employeeId;

	private String name;

	private String email;

	private String password;

	private String department;

        private String designation;

        private String shift;

	private String status;

	@Column(name = "contact_no", length = 20)
	private String contactNo;

        @Column(name = "date_of_birth")
        private LocalDate dateOfBirth;

        @Column(name = "date_of_joining")
        private LocalDate dateOfJoining;

	/**
	 * siteCode identifies which site/location this user belongs to.
	 * 
	 * TEMPORARY AUTH NOTE: X-User-Id header is used to identify the logged-in user.
	 * This MUST be replaced with JWT/session-based authentication before production deployment.
	 */
        @Column(name = "fcm_token", length = 1000)
        private String fcmToken;

	@Column(name = "site_code", length = 50)
	private String siteCode;

	@ManyToOne
	@JoinColumn(name = "role_id")
	private Role role;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getEmployeeId() {
		return employeeId;
	}

	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getDepartment() {
		return department;
	}

	public void setDepartment(String department) {
		this.department = department;
	}
        public String getDesignation() {
                return designation;
        }

        public void setDesignation(String designation) {
                this.designation = designation;
        }

        public String getShift() {
                return shift;
        }

        public void setShift(String shift) {
                this.shift = shift;
        }


	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getContactNo() {
		return contactNo;
	}

	public void setContactNo(String contactNo) {
		this.contactNo = contactNo;
	}
        public LocalDate getDateOfBirth() {
                return dateOfBirth;
        }

        public void setDateOfBirth(LocalDate dateOfBirth) {
                this.dateOfBirth = dateOfBirth;
        }

        public LocalDate getDateOfJoining() {
                return dateOfJoining;
        }

        public void setDateOfJoining(LocalDate dateOfJoining) {
                this.dateOfJoining = dateOfJoining;
        }
        public String getFcmToken() {
                return fcmToken;
        }

        public void setFcmToken(String fcmToken) {
                this.fcmToken = fcmToken;
        }


	public String getSiteCode() {
		return siteCode;
	}

	public void setSiteCode(String siteCode) {
		this.siteCode = siteCode;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}
}
