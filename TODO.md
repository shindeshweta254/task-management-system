# Eclipse/Maven Configuration Repair

## Steps
- [x] Step 1: Create missing `.classpath` (JRE System Library Java 17 + Maven classpath)
- [x] Step 2: Create `.settings/org.eclipse.wst.common.project.facet.core.xml` (Facet metadata)
- [x] Step 3: Create `.settings/org.eclipse.jdt.core.prefs` (Java 17 compiler settings)
- [x] Step 4: Create `.settings/org.eclipse.m2e.core.prefs` (Maven integration)
- [x] Step 5: Create `.settings/org.springframework.ide.eclipse.prefs` (Spring Boot IDE support)
- [x] Step 6: Run Maven dependency resolution (`mvnw.cmd clean install -DskipTests`)
- [x] Step 7: Verify the fix — ✅ Build successful, classes compiled to target/classes

