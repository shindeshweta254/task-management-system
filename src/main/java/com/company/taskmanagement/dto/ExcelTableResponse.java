package com.company.taskmanagement.dto;

import java.util.List;

public class ExcelTableResponse {

    // 2D cell table
    private List<List<String>> rows;

    public List<List<String>> getRows() {
        return rows;
    }

    public void setRows(List<List<String>> rows) {
        this.rows = rows;
    }
}

