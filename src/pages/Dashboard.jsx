import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 6;

export default function Dashboard() {
  const [, forceUpdate] = useState(0);

  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("DESC");
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  const { logout, user } = useAuth();

  // ================= SLA REFRESH =================
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ================= FETCH =================
  useEffect(() => {
    fetchIssues(false);

    const interval = setInterval(() => {
      fetchIssues(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  // ================= OUTSIDE CLICK =================
  useEffect(() => {
    function handleClick(e) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ================= FETCH ISSUES =================
  const fetchIssues = async (isSilent = false) => {
    try {
      if (!isSilent) setInitialLoading(true);

      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/issues/engineers/me/issues", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const noti = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIssues(res.data);
      setNotifications(noti.data);
    } catch {
      toast.error("Failed to load issues ❌");
    } finally {
      if (!isSilent) setInitialLoading(false);
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, status) => {
    try {
      if (loadingId) return;

      setLoadingId(id);

      const token = localStorage.getItem("token");

      const res = await api.patch(
        `/issues/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 200) {
        toast.success(`Marked as ${status} ✅`);

        setIssues((prev) =>
          prev.map((i) => (i._id === id ? { ...i, status } : i)),
        );
      }
    } catch {
      toast.error("Server error ❌");
    } finally {
      setLoadingId(null);
    }
  };

  // ================= MAP =================
  const openInMaps = (issue) => {
    if (!issue.location?.coordinates) return;

    const [lng, lat] = issue.location.coordinates;

    window.open(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  // ================= STATUS COLOR =================
  const getStatusColor = (s) => {
    if (s === "REPORTED") return "bg-gray-500";
    if (s === "VERIFIED") return "bg-yellow-500 text-black";
    if (s === "IN_PROGRESS") return "bg-blue-500";
    if (s === "RESOLVED") return "bg-green-500";
    return "bg-gray-500";
  };

  // ================= SLA =================
  const getTimeRemaining = (dueAt) => {
    const diff = new Date(dueAt) - new Date();

    if (diff <= 0) {
      return { text: "Overdue", color: "bg-red-600" };
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff / 1000) % 60);

    if (h < 6) {
      return { text: `${h}h ${m}m ${s}s`, color: "bg-red-500" };
    }

    if (h < 24) {
      return { text: `${h}h ${m}m`, color: "bg-yellow-500 text-black" };
    }

    return { text: `${h}h ${m}m`, color: "bg-green-600" };
  };

  // ================= FILTER =================
  const filtered = issues
    .filter((i) => (filter === "ALL" ? true : i.status === filter))
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "DESC") return b.priorityScore - a.priorityScore;
    return a.priorityScore - b.priorityScore;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);

  const paginated = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* ================= NAVBAR ================= */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Engineer Dashboard</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-xl hover:text-blue-400 transition"
              >
                🔔
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-50">
                  <div className="p-3 font-semibold border-b border-white/10">
                    Notifications
                  </div>

                  <div className="max-h-[280px] overflow-y-auto custom-scroll p-3 space-y-2">
                    {notifications.length === 0 && (
                      <p className="text-sm text-gray-400">No notifications</p>
                    )}

                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className="p-3 bg-white/5 rounded-lg text-sm"
                      >
                        {n.message}

                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {["ALL", "REPORTED", "VERIFIED", "IN_PROGRESS", "RESOLVED"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1 rounded-full text-sm ${
                    filter === s
                      ? "bg-blue-600"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ),
            )}
          </div>

          <div className="flex gap-3">
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20"
            />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20"
            >
              <option value="DESC">High → Low</option>
              <option value="ASC">Low → High</option>
            </select>
          </div>
        </div>

        {/* Issues */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((issue, i) => {
            const sla = issue.dueAt ? getTimeRemaining(issue.dueAt) : null;

            return (
              <motion.div
                key={issue._id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg"
              >
                <h2 className="font-semibold mb-2">{issue.title}</h2>

                <span
                  className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                    issue.status,
                  )}`}
                >
                  {issue.status}
                </span>

                {sla && (
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${sla.color}`}
                    >
                      ⏱ {sla.text}
                    </span>
                  </div>
                )}

                <div className="text-sm text-gray-400 mt-3 space-y-1">
                  <p>Priority: {issue.priorityScore}</p>
                  <p>Category: {issue.category}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-4">
                  {issue.status === "REPORTED" && (
                    <button
                      disabled={loadingId === issue._id}
                      onClick={() => updateStatus(issue._id, "VERIFIED")}
                      className="btn-blue"
                    >
                      Verify
                    </button>
                  )}

                  {issue.status === "VERIFIED" && (
                    <button
                      disabled={loadingId === issue._id}
                      onClick={() => updateStatus(issue._id, "IN_PROGRESS")}
                      className="btn-yellow"
                    >
                      Start Work
                    </button>
                  )}

                  {issue.status === "IN_PROGRESS" && (
                    <button
                      disabled={loadingId === issue._id}
                      onClick={() => updateStatus(issue._id, "RESOLVED")}
                      className="btn-green"
                    >
                      Mark Resolved
                    </button>
                  )}

                  <button
                    onClick={() => openInMaps(issue)}
                    className="bg-white/10 hover:bg-white/20 py-2 rounded-xl"
                  >
                    View on Map
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  page === i + 1
                    ? "bg-blue-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
