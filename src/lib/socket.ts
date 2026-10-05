import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(accessToken: string) {
  socket?.disconnect();
  socket = io("http://localhost:3000", { auth: { token: accessToken } });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
