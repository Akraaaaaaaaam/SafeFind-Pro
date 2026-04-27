import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import useNotificationCount from "../hooks/useNotificationCount";

export default function NotificationBellBadge() {
  const { unreadCount } = useNotificationCount();

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center rounded-xl border px-4 py-2 hover:bg-slate-50"
    >
      <Bell className="h-5 w-5" />

      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}