import axiosClient from "./axiosClient";


/**
 * Check In (Punch In)
 * POST /api/attendance/checkin
 * X-User-Id automatically axiosClient interceptor se jayega
 */
export async function checkIn(location) {
  try {

    const res = await axiosClient.post(
      "/api/attendance/checkin",
      {
        location
      }
    );

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
export async function checkOut(attendanceId) {

  try {

    const res = await axiosClient.put(
      `/api/attendance/checkout/${attendanceId}`
    );

    return res.data;

  } catch (error) {

    console.error("Check-out API error:", error);
    throw error;

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