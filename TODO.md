# TODO - Work Proof Upload in Reports

## Current Status
- ✅ Reports translation issue (dashboard sidebar) fixed earlier.
- ❌ Reports me Work Proof + Live Location upload feature abhi implement nahi hua.

## Implementation Steps
1) **Backend (Spring Boot)**
   - Update `src/main/java/com/company/taskmanagement/entity/Report.java` with fields:
     - proofFileName (String)
     - proofFilePath/proofUrl (String)
     - latitude (Double)
     - longitude (Double)
     - locationAddress (String, optional)
   - Update `ReportController.java`:
     - Add endpoint to accept `MultipartFile proof` + location + report text fields.
   - Update `ReportService.java` if needed.

2) **Frontend (React/Vite)**
   - Update `frontend/SSS-Frontend/src/Pages/Reports/reports.jsx` with:
     - Employee/Supervisor tab:
       - completedWork, pendingWork, issues input
       - file upload (image/screenshot)
       - browser geolocation capture (lat/lng)
       - submit => `POST /api/reports/upload`
     - Owner/Admin tab:
       - list saved reports with proof preview + location text

3) **Testing**
   - Backend: `mvn clean package`
   - Frontend: `cd frontend/SSS-Frontend && npm run build`


