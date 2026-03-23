import axios from "axios";

const api = axios.create({
  baseURL: "https://urbanwatch-backend.onrender.com/api",
});

export default api;
