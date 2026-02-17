import { io } from "socket.io-client";

const socket = io("https://urbanwatch-backend.onrender.com");

export default socket;
