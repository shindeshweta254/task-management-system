package com.company.taskmanagement.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

@Component
public class ExcelTableParser {

    private final DataFormatter formatter = new DataFormatter();

    public List<List<String>> parseFirstSheetAsTable(InputStream inputStream) throws Exception {
        try (InputStream is = inputStream) {
            Workbook workbook = WorkbookFactory.create(is);
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return List.of();

            List<List<String>> rows = new ArrayList<>();
            int lastRow = sheet.getLastRowNum();

            for (int r = 0; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    rows.add(List.of());
                    continue;
                }

                int lastCell = Math.max(0, row.getLastCellNum() - 1);
                List<String> cells = new ArrayList<>();

                for (int c = 0; c <= lastCell; c++) {
                    if (row.getCell(c) == null) {
                        cells.add("");
                    } else {
                        cells.add(formatter.formatCellValue(row.getCell(c)).trim());
                    }
                }
                rows.add(cells);
            }

            return rows;
        }
    }
}

