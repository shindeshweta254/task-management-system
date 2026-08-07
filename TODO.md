# Attendance Location & Selfie Saving/Display Fix

## Original Issue
- Attendance history showed wrong/empty location.
- Punch In Selfie and Punch Out Selfie showed "No Selfie".
- Database attendance records had NULL location and selfie paths.

## Root Cause
`axiosClient.js` sets a global default `Content-Type: application/json`. When sending a
`FormData` body, axios 1.x converts it to JSON (via the default `transformRequest`), so the
backend's `@RequestParam location` and `MultipartFile selfie` both arrive as NULL.

## Fixes Applied (source)
- [x] 1. `attendanceApi.js` — Override global JSON Content-Type to `multipart/form-data`
      for both `POST /api/attendance/checkin` and `PUT /api/attendance/checkout/{id}`,
      so `location` and `selfie` are sent as a real multipart request.
- [x] 2. `attendance.jsx` — Location display now shows only the actual address
      (`location`/`checkInAddress`/`checkOutAddress`/`latestLiveAddress`), no lat/lng fallback.
- [x] 3. `DirectorDashboard.jsx` — `getLocationText` now shows only the address, no lat/lng fallback.

## Backend (already correct, verified)
- [x] 4. `AttendanceController` saves `location`, `checkInSelfiePath`, `checkOutSelfiePath`
      from multipart parts.
- [x] 5. `AttendanceService` persists these fields on checkIn/checkOut.
- [x] 6. `/uploads/**` static handler serves selfie images (CorsConfig).
- [x] 7. `mvnw clean compile` succeeded — backend compiles cleanly.
- [x] 8. Frontend `vite build` succeeded — `dist/` generated with `attendance.jsx`,
      `DirectorDashboard.jsx`, and `attendanceApi.js` changes.
- [ ] 9. **REQUIRED on machine**: Restart the backend server so it loads the freshly
      compiled classes (the running server was executing stale `target/classes`).

## Not Changed (per requirements)
- Authentication
- X-User-Id logic
- Attendance status logic
- Working hours logic
- Database tables/schema
