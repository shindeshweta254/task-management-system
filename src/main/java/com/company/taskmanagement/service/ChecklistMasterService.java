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

import com.company.taskmanagement.entity.ChecklistMaster;
import com.company.taskmanagement.repository.ChecklistMasterRepository;

@Service
public class ChecklistMasterService {

    @Autowired
    private ChecklistMasterRepository checklistMasterRepository;

    public String importChecklistExcel(MultipartFile file) {

        int savedCount = 0;

        try {

            InputStream inputStream = file.getInputStream();

            Workbook workbook = WorkbookFactory.create(inputStream);

            DataFormatter formatter = new DataFormatter();

            checklistMasterRepository.deleteAll();

            for (int s = 0; s < workbook.getNumberOfSheets(); s++) {

                Sheet sheet = workbook.getSheetAt(s);

                String sheetName = sheet.getSheetName().trim();

                if (sheetName.equalsIgnoreCase("Sheet3")) {
                    continue;
                }

                for (int i = 0; i <= sheet.getLastRowNum(); i++) {

                    Row row = sheet.getRow(i);

                    if (row == null)
                        continue;

                    String col1 = formatter.formatCellValue(row.getCell(0)).trim();
                    String col2 = formatter.formatCellValue(row.getCell(1)).trim();
                    String col3 = formatter.formatCellValue(row.getCell(2)).trim();

                    String checkPoint = "";
                    String sectionName = "";
                    String frequency = "";

                    if (!col2.isBlank()) {

                        checkPoint = col2;
                        sectionName = col1;
                        frequency = col3;

                    } else if (!col1.isBlank()) {

                        checkPoint = col1;
                        sectionName = sheetName;

                    }

                    if (checkPoint.isBlank()) {
                        continue;
                    }

                    String lower = checkPoint.toLowerCase();

                    if (lower.contains("sss facility")
                            || lower.contains("location")
                            || lower.contains("date")
                            || lower.contains("site name")
                            || lower.contains("month")
                            || lower.contains("sr.no")
                            || lower.contains("scheduled jobs")
                            || lower.contains("check point")
                            || lower.contains("water supply")
                            || lower.contains("tanker water")) {

                        continue;
                    }

                    ChecklistMaster checklist = new ChecklistMaster();

                    checklist.setSheetName(sheetName);
                    checklist.setSiteName("Purvankra");
                    checklist.setSectionName(sectionName);
                    checklist.setCheckPoint(checkPoint);
                    checklist.setFrequency(frequency);
                    checklist.setSequenceNo(i + 1);

                    checklistMasterRepository.save(checklist);

                    savedCount++;

                }

            }

            workbook.close();

            return "Checklist imported successfully. Saved : " + savedCount;

        } catch (Exception e) {

            e.printStackTrace();

            return "Checklist import failed : " + e.getMessage();

        }

    }

    // ===========================
    // GET ALL CHECKLIST
    // ===========================

    public List<ChecklistMaster> getAllChecklist() {

        return checklistMasterRepository.findAll();

    }

    // ===========================
    // GET CHECKLIST BY SHEET
    // ===========================

    public List<ChecklistMaster> getChecklistBySheet(String sheetName) {

        return checklistMasterRepository
                .findBySheetNameOrderBySequenceNoAsc(sheetName);

    }

}