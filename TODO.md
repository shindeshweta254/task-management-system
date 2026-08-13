# Backend JWT Authentication - Implementation TODO

## Progress
- [x] 1. Add JWT dependencies to pom.xml (jjwt-api, jjwt-impl, jjwt-jackson 0.11.5)
- [x] 2. Add jwt.secret and jwt.expiration to application.properties
- [x] 3. Create JwtUtil.java
- [x] 4. Create JwtAuthenticationFilter.java
- [x] 5. Create JwtAuthenticationEntryPoint.java
- [x] 6. Create CustomUserDetailsService.java
- [x] 7. Create PasswordConfig.java
- [x] 8. Create JwtResponse.java (dto)
- [x] 9. Update SecurityConfig.java (stateless, JWT filter, BCrypt, permit login/uploads)
- [x] 10. Update UserController.java login to return JwtResponse
- [x] 11. Run Maven compile to verify (BUILD SUCCESS, 107 files compiled)

## Fix: Employee Task API 401
- [x] 12. Update TasController.getTasksByEmployee() to resolve the authenticated
       (JWT) user from SecurityContextHolder first, with X-User-Id fallback.
- [x] 13. Update Dashboard.jsx to use axiosClient (which sends the JWT
       Authorization: Bearer header) instead of raw `fetch` with only X-User-Id.

## Note
All frontend API calls that used raw `fetch` with X-User-Id were also migrated to
use `axiosClient` (which attaches the JWT Bearer token automatically) for:
- Reports.jsx
- Notifications.jsx
- UpdatedChecklist.jsx
- Dashboard.jsx
This preserves existing X-User-Id fallback behavior on the backend via
JwtAuthenticationFilter's backward-compatible fallback.

