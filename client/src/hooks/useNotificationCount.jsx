import { useEffect, useState } from "react";
import api from "../api/api";
import { socket } from "../api/socket";

export default function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      const notifications = data.notifications || [];
      const count = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();

    const refresh = () => loadNotifications();

    socket.on("alert:created", refresh);
    socket.on("report:created", refresh);
    socket.on("alert:resolved", refresh);
    socket.on("alert:moderated", refresh);

    return () => {
      socket.off("alert:created", refresh);
      socket.off("report:created", refresh);
      socket.off("alert:resolved", refresh);
      socket.off("alert:moderated", refresh);
    };
  }, []);

  return { unreadCount, refreshNotificationCount: loadNotifications };
}