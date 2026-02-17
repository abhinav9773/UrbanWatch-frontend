import api from "./axios";

export const getNotifications = () => {
  const token = localStorage.getItem("token");

  return api.get("/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markAsRead = (id) => {
  const token = localStorage.getItem("token");

  return api.patch(
    `/notifications/${id}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
