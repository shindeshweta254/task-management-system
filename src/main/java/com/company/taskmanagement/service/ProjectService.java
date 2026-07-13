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

import com.company.taskmanagement.entity.Project;
import com.company.taskmanagement.entity.ProjectEmployee;
import com.company.taskmanagement.repository.ProjectEmployeeRepository;
import com.company.taskmanagement.repository.ProjectRepository;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectEmployeeRepository projectEmployeeRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public Project updateProject(Long id, Project updated) {
        Project project = getProjectById(id);
        project.setSiteName(updated.getSiteName());
        project.setSheetName(updated.getSheetName());
        return projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    public ProjectEmployee updateEmployee(Long empId, ProjectEmployee updated) {
        ProjectEmployee emp = projectEmployeeRepository.findById(empId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        emp.setName(updated.getName());
        emp.setDesignation(updated.getDesignation());
        emp.setPNo(updated.getPNo());
        return projectEmployeeRepository.save(emp);
    }

    public void deleteEmployee(Long empId) {
        projectEmployeeRepository.deleteById(empId);
    }

    public String importFromExcel(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a valid Excel file");
        }

        int totalProjects = 0;
        int totalEmployees = 0;
        DataFormatter formatter = new DataFormatter();

        try (
            InputStream is = file.getInputStream();
            Workbook workbook = WorkbookFactory.create(is)
        ) {
            int sheetCount = workbook.getNumberOfSheets();

            for (int s = 0; s < sheetCount; s++) {
                Sheet sheet = workbook.getSheetAt(s);
                if (sheet == null) continue;

                String sheetName = sheet.getSheetName().trim();

                // Row 2 (index 1) mein SITE : ... hota hai — kisi bhi column mein
                String siteName = null;
                Row siteRow = sheet.getRow(1);
                if (siteRow != null) {
                    for (int c = 0; c < siteRow.getLastCellNum(); c++) {
                        String val = formatter.formatCellValue(siteRow.getCell(c)).trim();
                        if (val.toUpperCase().startsWith("SITE")) {
                            siteName = val.replaceFirst("(?i)SITE\\s*:\\s*", "").trim();
                            break;
                        }
                    }
                }

                // Agar Row 1 mein nahi mila to Row 0 try karo
                if (siteName == null || siteName.isBlank()) {
                    Row row0 = sheet.getRow(0);
                    if (row0 != null) {
                        for (int c = 0; c < row0.getLastCellNum(); c++) {
                            String val = formatter.formatCellValue(row0.getCell(c)).trim();
                            if (val.toUpperCase().startsWith("SITE")) {
                                siteName = val.replaceFirst("(?i)SITE\\s*:\\s*", "").trim();
                                break;
                            }
                        }
                    }
                }

                // Agar site name nahi mila to sheet name use karo
                if (siteName == null || siteName.isBlank()) {
                    siteName = sheetName;
                }

                if (siteName.isBlank()) continue;

                // Existing project dhundo ya naya banao
                Project project = projectRepository.findBySiteName(siteName)
                        .orElse(new Project());
                project.setSiteName(siteName);
                project.setSheetName(sheetName);
                project.getEmployees().clear();

                // Row 3 (index 2) = header, Row 4 (index 3) se employee data
                // Employee Name = Column B (index 1)
                // Designation  = Column C (index 2)
                // P.NO         = find karo "P.NO" header se

                int nameCol = 1;   // B
                int desigCol = 2;  // C
                int pnoCol = -1;

                // Header row se P.NO column dhundo
                Row headerRow = sheet.getRow(2);
                if (headerRow != null) {
                    for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                        String h = formatter.formatCellValue(headerRow.getCell(c)).trim().toUpperCase();
                        if (h.contains("P.NO") || h.equals("PNO") || h.contains("P NO")) {
                            pnoCol = c;
                        }
                        if (h.contains("EMPLOYEE NAME") || h.contains("NAME")) {
                            nameCol = c;
                        }
                        if (h.contains("DESIG") || h.contains("DESIGNATION")) {
                            desigCol = c;
                        }
                    }
                }

                int empCount = 0;
                for (int r = 3; r <= sheet.getLastRowNum(); r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;

                    String empName = formatter.formatCellValue(row.getCell(nameCol)).trim();
                    if (empName.isBlank()) continue;

                    // Skip summary/total rows
                    String lower = empName.toLowerCase();
                    if (lower.contains("total") || lower.contains("grand")
                            || lower.contains("summary") || lower.startsWith("sr")) continue;

                    String desig = formatter.formatCellValue(row.getCell(desigCol)).trim();
                    String pno = pnoCol >= 0
                            ? formatter.formatCellValue(row.getCell(pnoCol)).trim()
                            : "";

                    ProjectEmployee emp = new ProjectEmployee();
                    emp.setName(empName);
                    emp.setDesignation(desig);
                    emp.setPNo(pno);
                    emp.setProject(project);
                    project.getEmployees().add(emp);
                    empCount++;
                }

                if (empCount > 0) {
                    projectRepository.save(project);
                    totalProjects++;
                    totalEmployees += empCount;
                }
            }

            return "Import successful! Projects: " + totalProjects
                    + ", Total Employees: " + totalEmployees;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Excel import failed: " + e.getMessage(), e);
        }
    }
}
