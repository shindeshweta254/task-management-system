import { API_BASE_URL } from "./index";
import { getUserFromStorage } from "../utils/userStorage";


const jsonOrText = async (res) => {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};



export async function createTask(payload) {

  const user = getUserFromStorage("user");


  const res = await fetch(`${API_BASE_URL}/api/tasks`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-User-Id": String(user?.id),
    },


    body: JSON.stringify(payload),

  });



  const data = await jsonOrText(res);


  if (!res.ok) {

    const msg =
      typeof data === "string"
        ? data
        : JSON.stringify(data);


    throw new Error(
      `Task create failed (${res.status}) ${msg}`
    );

  }


  return data;
}