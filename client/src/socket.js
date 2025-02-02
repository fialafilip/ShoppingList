import { io } from "socket.io-client";

// Vytvoříme instanci Socket.IO
export const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: true,
});

// Debug události
socket.on("connect", () => {
  console.log("Connected to socket server");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});
