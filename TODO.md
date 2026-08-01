# Director Dashboard Attendance Feature — TODO

## Backend (`AttendanceController` + `AttendanceService`)
- [x] 1. `AttendanceController` — added `GET /api/attendance/all` endpoint (Director-only, validates via `validateDirectorDashboardAccess`)
- [x] 2. `AttendanceService.getAllAttendanceWithDetails()` — fetches ALL attendance records (no role filtering), enriches with employee name/ID/role, location, coordinates, selfie from Report entity
- [x] 3. `AttendanceReportDTO` — contains all required fields: employeeName, employeeId, roleName, date, checkInTime, checkOutTime, workingHours, status, location, latitude, longitude, selfieFilePath, selfieFileName
- [x] 4. `Attendance` entity — has `location` field (String), `user` relation (ManyToOne)
- [x] 5. Access validation: `validateDirectorDashboardAccess()` in `AccessService` ensures only DIRECTOR and SP001 roles can access
- [x] 6. `AttendanceRepository.findAll()` — returns all attendance records

## Frontend (DirectorDashboard.jsx)
- [x] 7. `fetchAllAttendance()` in `directorDashboardApi.js` calls `GET /api/attendance/all` with X-User-Id header
- [x] 8. DirectorDashboard.jsx — Attendance tab loads via `fetchAllAttendance()` in `loadDashboardData()`
- [x] 9. `AttendanceTable` component shows 10 columns: Employee Name, Employee ID, Role, Date, Check-in, Check-out, Working Hours, Status, Location, Selfie
- [x] 10. Field mapping uses `AttendanceReportDTO` field names: employeeName, employeeId, roleName, date, checkInTime, checkOutTime, workingHours, status, location, checkInAddress, latitude, longitude, selfieFilePath
- [x] 11. Selfie modal viewer (click thumbnail → fullscreen overlay with close button)
- [x] 12. Location display: `item.location` → `item.checkInAddress` → `item.latitude, longitude` → "-"
- [x] 13. Status badges: Present (green), Late (amber), Absent (red), Half Day (yellow), Holiday (blue)
- [x] 14. DirectorDashboard.css — styles for attendance status, selfie thumb, modal, location cell

## Not Modified
- [x] Login functionality — unchanged
- [x] Task module — unchanged
- [x] Employee Attendance check-in/check-out — unchanged
- [x] Existing UI structure and styling — preserved

## API Endpoint
```
GET /api/attendance/all
Headers: X-User-Id: <director-user-id>
Response: AttendanceReportDTO[]
