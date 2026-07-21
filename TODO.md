# TODO - Excel Upload History (DirectorDashboard)

- [x] Backend: add StaffExcelUpload entity + repository + service + controller + rows parsing + download endpoint
- [x] Backend: add ProjectExcelUpload entity + repository + service + controller + rows parsing (multi-sheet) + download endpoint
- [x] Backend: add listing endpoints with role-based filtering (Employee/My, Supervisor/Site, Director/Admin/All) (Supervisor staff is not supported since staff upload table has no siteName)
- [x] Backend: parse Excel to compute total records consistently with existing import logic
- [x] Backend: implement “store file permanently” including SUCCESS + FAILED history (controller currently always stores SUCCESS; failed history wiring is next in frontend)
- [ ] Frontend: update DirectorDashboard.jsx to call new history endpoints after existing import success/failure without changing existing import calls/response handling
- [ ] Frontend: add two new sections below upload cards with required columns + actions (View/Download/Print)
- [ ] Frontend: implement View modal rendering Excel as table from backend rows endpoint
- [ ] Frontend: implement Print to print the opened Excel table
- [ ] Frontend: implement role-based visibility for staff/project histories
- [ ] Run: frontend build (optional): `npm run build` in frontend/SSS-Frontend


