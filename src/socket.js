import { io } from "socket.io-client";

const socket = io("https://urbanwatch-backend.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
