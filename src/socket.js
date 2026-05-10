import { io } from "socket.io-client";

const socket = io("https://urbanwatch-backend.onrender.com", {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  autoConnect: true,        // ← keep this true
  withCredentials: false,
});

// Debug only in development
if (import.meta.env.DEV) {
  socket.on("connect",    () => console.log("Socket connected:", socket.id));
  socket.on("disconnect", () => console.log("Socket disconnected"));
}

export default socket;