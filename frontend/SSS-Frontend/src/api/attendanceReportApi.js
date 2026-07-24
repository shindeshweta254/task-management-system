import axiosClient from "./axiosClient";

export async function fetchAttendanceReports({
  startDate,
  endDate,
  site,
  employee,
  department,
  status,
} = {}) {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (site) params.site = site;
  if (employee) params.employee = employee;
  if (department) params.department = department;
  if (status) params.status = status;

  const res = await axiosClient.get("/api/attendance-reports", { params });
  return res.data;
}

export async function updateLiveLocation(userId, latitude, longitude, locationAddress) {
  const res = await axiosClient.post("/api/attendance-reports/live-location", {
    userId,
    latitude,
    longitude,
    locationAddress,
  });
  return res.data;
}

export async function getLiveLocation(userId) {
  const res = await axiosClient.get(`/api/attendance-reports/live-location/${userId}`);
  return res.data;
}
