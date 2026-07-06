package com.company.taskmanagement.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "checklist_master")
public class ChecklistMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sheetName;
    private String siteName;
    private String sectionName;

    @Column(length = 1000)
    private String checkPoint;

    private String frequency;
    private Integer sequenceNo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSheetName() { return sheetName; }
    public void setSheetName(String sheetName) { this.sheetName = sheetName; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public String getSectionName() { return sectionName; }
    public void setSectionName(String sectionName) { this.sectionName = sectionName; }

    public String getCheckPoint() { return checkPoint; }
    public void setCheckPoint(String checkPoint) { this.checkPoint = checkPoint; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public Integer getSequenceNo() { return sequenceNo; }
    public void setSequenceNo(Integer sequenceNo) { this.sequenceNo = sequenceNo; }
}
