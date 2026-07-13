- [ ] Confirm exact failing Excel upload request URL and failing request (now known: `POST http://localhost:8080/api/users/import-staff`).
- [ ] Find backend endpoint/controller handling `/api/users/import-staff` and check Spring Security / CORS behavior.
- [x] Verified controller exists: `UserController#importStaffFromExcel` expects `@RequestParam("file") MultipartFile file`.
- [x] Applied earlier CORS/multipart fixes (did not resolve 403).
- [ ] Next: temporarily disable Spring Security entirely (for local) to confirm it’s a security rule vs other problem.

