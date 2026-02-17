import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getNotifications, markAsRead } from "../api/notifications";
import socket from "../socket";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error("Notification fetch failed", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen realtime
  useEffect(() => {
    socket.on("notification:new", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => socket.off("notification:new");
  }, []);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark as read
  const handleRead = async (id) => {
    await markAsRead(id);

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-white/20 transition"
      >
        <Bell size={22} className="text-white" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs px-1.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white/20 backdrop-blur-md shadow-xl rounded-xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/20 text-sm font-semibold text-white">
            Notifications
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-white/70 text-center">
                No notifications
              </p>
            )}

            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleRead(n._id)}
                className={`p-3 text-sm cursor-pointer border-b border-white/10 hover:bg-white/10 transition
                  ${!n.isRead ? "bg-white/20 font-semibold" : "text-white/70"}
                `}
              >
                {n.message}

                <p className="text-xs text-white/50 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
