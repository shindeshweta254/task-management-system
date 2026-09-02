package com.company.taskmanagement.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "attendance")
public class Attendance {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private LocalDate attendanceDate;

	private LocalTime checkInTime;

	private LocalTime checkOutTime;

	private String status;
	
	private Double workingHours;

private String location;

        private Double latitude;

        private Double longitude;
private String checkInSelfiePath;

	private String checkOutSelfiePath;

        // SELF = employee marked own attendance
        // SUPERVISOR_PHOTO = supervisor marked attendance after face verification
        private String attendanceMode = "SELF";

        // User ID of supervisor/person who marked the attendance
        private Long markedByUserId;

        // True only after actual registered-face verification succeeds
        private Boolean supervisorVerified = false;

        public String getAttendanceMode() {
                return attendanceMode;
        }

        public void setAttendanceMode(String attendanceMode) {
                this.attendanceMode = attendanceMode;
        }

        public Long getMarkedByUserId() {
                return markedByUserId;
        }

        public void setMarkedByUserId(Long markedByUserId) {
                this.markedByUserId = markedByUserId;
        }

        public Boolean getSupervisorVerified() {
                return supervisorVerified;
        }

        public void setSupervisorVerified(Boolean supervisorVerified) {
                this.supervisorVerified = supervisorVerified;
        }

	public String getCheckInSelfiePath() {
		return checkInSelfiePath;
	}

	public void setCheckInSelfiePath(String checkInSelfiePath) {
		this.checkInSelfiePath = checkInSelfiePath;
	}

	public String getCheckOutSelfiePath() {
		return checkOutSelfiePath;
	}

	public void setCheckOutSelfiePath(String checkOutSelfiePath) {
		this.checkOutSelfiePath = checkOutSelfiePath;
	}

	public Double getWorkingHours() {
		return workingHours;
	}

	public void setWorkingHours(Double workingHours) {
		this.workingHours = workingHours;
	}

public String getLocation() {
                return location;
        }

        public Double getLatitude() {
                return latitude;
        }

        public void setLatitude(Double latitude) {
                this.latitude = latitude;
        }

        public Double getLongitude() {
                return longitude;
        }

        public void setLongitude(Double longitude) {
                this.longitude = longitude;
        }
public void setLocation(String location) {
		this.location = location;
	}

	

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User user;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public LocalDate getAttendanceDate() {
		return attendanceDate;
	}

	public void setAttendanceDate(LocalDate attendanceDate) {
		this.attendanceDate = attendanceDate;
	}

	public LocalTime getCheckInTime() {
		return checkInTime;
	}

	public void setCheckInTime(LocalTime checkInTime) {
		this.checkInTime = checkInTime;
	}

	public LocalTime getCheckOutTime() {
		return checkOutTime;
	}

	public void setCheckOutTime(LocalTime checkOutTime) {
		this.checkOutTime = checkOutTime;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

}

