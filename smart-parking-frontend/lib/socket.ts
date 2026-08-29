import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ["websocket"],
      // Funksion (jo objekt statik): rivlerësohet në çdo (ri)lidhje, kështu
      // që token-i i freskët përdoret edhe pas login/refresh — i domosdoshëm
      // që gateway-i të bashkojë klientin te room-i i tij privat i njoftimeve.
      auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    });
  }

  return socket;
}
