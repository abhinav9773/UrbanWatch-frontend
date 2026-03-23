import { io } from "socket.io-client";

const socket = io("https://urbanwatch-backend.onrender.com", {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
