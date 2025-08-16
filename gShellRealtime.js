// gShellRealtime.js
import { io } from "socket.io-client";

let socket;

export function init({ accessKey, userId, eventNames = [], onMessage }) {
  if (!accessKey) throw new Error("Missing accessKey for realtime");

  console.log("🔌 Initializing socket connection...");
  console.log("👤 User ID:", userId);
  console.log("🔑 Access Key:", accessKey);
  console.log("📡 Event Names:", eventNames);

  socket = io("http://74.208.13.213:3000", {
    auth: { accessKey, userId },
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    console.log("🟢 gShell Realtime connected");
    console.log("🔗 Socket ID:", socket.id);
    socket.onAny((event, data) => {
      console.log("📡 [onAny] Event:", event, data);
    });
    
    // Subscribe to provided events
    eventNames.forEach(event => {
      console.log("📡 Subscribing to event:", event);
      socket.on(event, (data) => {
        console.log("📥 Received event:", event);
        console.log("📊 Event data:", data);
        if (onMessage) onMessage(event, data);
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 gShell Realtime disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });

  // Return socket for cleanup
  return socket;
}

export function emit(eventName, data) {
  if (socket && socket.connected) {
    console.log("📤 Emitting event:", eventName, data);
    socket.emit(eventName, data);
  } else {
    console.warn("⚠️ Socket not connected, cannot emit:", eventName);
  }
}

export function disconnect() {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
}

const gShellRealtime = {
  init,
  emit,
  disconnect
};

export default gShellRealtime;