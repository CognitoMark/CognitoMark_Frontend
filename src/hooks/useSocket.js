import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNotify } from "../components/Toast";
import { debounce } from "../utils/debounce";

export const useSocket = (handlers = {}) => {
  const socketRef = useRef(null);
  const notify = useNotify();

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const eventKeys = Object.keys(handlers);
  const debouncedHandlersRef = useRef({});

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      }
    );
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      notify.error("Real-time disconnect. Reconnecting...", "Socket Error");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    eventKeys.forEach((event) => {
      if (!debouncedHandlersRef.current[event]) {
        debouncedHandlersRef.current[event] = debounce((...args) => {
          const fn = handlersRef.current[event];
          if (fn) fn(...args);
        }, 1500);
      }
      socket.on(event, debouncedHandlersRef.current[event]);
    });

    return () => {
      eventKeys.forEach((event) => {
        if (debouncedHandlersRef.current[event]) {
          socket.off(event, debouncedHandlersRef.current[event]);
        }
      });
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKeys.join(",")]);

  return socketRef;
};
