package com.company.taskmanagement.dto;

import org.springframework.web.multipart.MultipartFile;

public class UploadHistoryCreateRequest {
    public MultipartFile file;

    public Long uploadedByUserId;

    public String uploadedByName;

    public String uploadedByRole;

    // SUCCESS/FAILED
    public String status;

    // optional
    public String siteName;
}

