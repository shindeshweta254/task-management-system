import axiosClient from "./axiosClient";


/**
 * Check In (Punch In)
 * POST /api/attendance/checkin
 * X-User-Id automatically axiosClient interceptor se jayega
 */
export async function checkIn(location, latitude, longitude, selfie) {
  try {

const formData = new FormData();
    formData.append("location", location || "");

    // Append live GPS coordinates for check-in
    if (latitude != null) formData.append("latitude", String(latitude));
    if (longitude != null) formData.append("longitude", String(longitude));

    // Append selfie photo as a file if provided
    if (selfie) {
      formData.append("selfie", selfieFileFromDataUrl(selfie));
    }

// IMPORTANT: The axiosClient has a global default "Content-Type: application/json".
    // When sending FormData, axios would convert it to JSON and the backend would
    // receive NULL for both the location and the selfie file. We MUST override the
    // Content-Type to multipart/form-data so axios sends a real multipart request
    // (axios sets the correct boundary automatically for FormData).
    const res = await axiosClient.post("/api/attendance/checkin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;

  } catch (error) {

    console.error("Check-in API error:", error);
    throw error;

  }
}



/**
 * Check Out (Punch Out)
 * PUT /api/attendance/checkout/{attendanceId}
 * X-User-Id automatically axiosClient interceptor se jayega
 */
export async function checkOut(attendanceId, location, latitude, longitude, selfie) {

  try {

    const formData = new FormData();

    // Append live GPS location for checkout (reverse-geocoded address)
    formData.append("location", location || "");

    // Append live GPS coordinates for checkout
    if (latitude != null) formData.append("latitude", String(latitude));
    if (longitude != null) formData.append("longitude", String(longitude));

    // Append selfie photo as a file if provided
    if (selfie) {
      formData.append("selfie", selfieFileFromDataUrl(selfie));
    }

// IMPORTANT: Same as check-in — override the global "application/json"
    // Content-Type so axios sends a real multipart request (correct boundary set
    // automatically for FormData). Otherwise location and selfie arrive as NULL.
    const res = await axiosClient.put(
      `/api/attendance/checkout/${attendanceId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return res.data;

  } catch (error) {

    console.error("Check-out API error:", error);
    throw error;

  }

}

/**
 * Update attendance status for today (Half Day / Week Off / Holiday / Present).
 * PUT /api/attendance/status
 * Sends JSON body { status, location }.
 * X-User-Id automatically axiosClient interceptor se jayega
 */
export async function updateAttendanceStatus(status, location) {
  try {
    const res = await axiosClient.put("/api/attendance/status", {
      status: status || "",
      location: location || "",
    });
    return res.data;
  } catch (error) {
    console.error("Update attendance status API error:", error);
    throw error;
  }
}

/**
 * Convert a base64 data URL (from canvas toDataURL) into a File object.
 */
function selfieFileFromDataUrl(dataUrl) {
  try {
    const arr = dataUrl.split(",");
    const mime = (arr[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime === "image/png" ? "png" : "jpg";
    return new File([u8arr], `punch_${Date.now()}.${ext}`, { type: mime });
  } catch (e) {
    console.error("Failed to convert selfie data URL to file:", e);
    return null;
  }
}



/**
 * Fetch ALL attendance
 * Director / Owner / Admin
 * GET /api/attendance/all
 */
export async function fetchAllAttendance() {

  try {

    const res = await axiosClient.get(
      "/api/attendance/all"
    );


    return Array.isArray(res.data)
      ? res.data
      : [];


  } catch (error) {

    console.error(
      "Fetch all attendance API error:",
      error
    );

    throw error;

  }

}



/**
 * Fetch logged-in user's attendance
 * GET /api/attendance/me
 */
export async function fetchMyAttendance() {

  try {

    const res = await axiosClient.get(
      "/api/attendance/me"
    );
console.log("SELFIE CHECK RESPONSE =", res.data);
    console.log(
      "ATTENDANCE DATA =",
      JSON.stringify(res.data, null, 2)
    );

    return Array.isArray(res.data)
      ? res.data
      : [];


  } catch (error) {

    console.error(
      "Fetch my attendance API error:",
      error
    );

    throw error;

  }

}

/**
 * Fetch site attendance
 * Supervisor / Manager
 * GET /api/attendance/my-site
 */
export async function fetchMySiteAttendance() {

  try {

    const res = await axiosClient.get(
      "/api/attendance/my-site"
    );


    return Array.isArray(res.data)
      ? res.data
      : [];


  } catch (error) {

    console.error(
      "Fetch my site attendance API error:",
      error
    );

    throw error;

  }

}



/**
 * Permanently delete all attendance records for a given year and month.
 * Director / Admin
 * DELETE /api/attendance/delete-by-month?year=2025&month=3
 */
export async function deleteAttendanceByMonth(year, month) {

  try {

    const res = await axiosClient.delete(
      "/api/attendance/delete-by-month",
      {
        params: { year, month }
      }
    );

    return res.data;

  } catch (error) {

    console.error(
      "Delete attendance by month API error:",
      error
    );

    throw error;

  }

}
