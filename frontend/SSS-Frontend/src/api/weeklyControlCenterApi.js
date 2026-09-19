import { API_BASE_URL, apiFetch } from "./index";

const WEEKLY_CONTROL_CENTER_URL =
  `${API_BASE_URL}/api/weekly-control-center`;

export async function fetchWeeklyControlCenter(
  startDate,
  endDate,
  site = ""
) {
  const params = new URLSearchParams();

  params.set("startDate", startDate);
  params.set("endDate", endDate);

  if (site && site.trim()) {
    params.set("site", site.trim());
  }

  return apiFetch(
    `${WEEKLY_CONTROL_CENTER_URL}?${params.toString()}`
  );
}