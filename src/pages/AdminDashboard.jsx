import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import IssueMap from "../components/IssueMap";
import NotificationBell from "../components/NotificationBell";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [engineers, setEngineers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [engineerForm, setEngineerForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

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

  const getToken = () => localStorage.getItem("token");

  // ================= LOAD =================
  const loadAll = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${getToken()}`,
      };

      const [i, w, h, s, e, n] = await Promise.all([
        api.get("/issues", { headers }),
        api.get("/assignments/workload", { headers }),
        api.get("/assignments/history", { headers }),
        api.get("/stats", { headers }),
        api.get("/users?role=ENGINEER", { headers }),
        api.get("/notifications", { headers }),
      ]);

      setIssues(i.data);
      setWorkload(w.data);
      setHistory(h.data);
      setStats(s.data);
      setEngineers(e.data);
      setNotifications(n.data);
    } catch {
      toast.error("Failed to load admin data ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= AUTO ASSIGN =================
  const autoAssign = async (id) => {
    try {
      await api.post(
        `/issues/${id}/auto-assign`,
        {},
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      toast.success("Auto assigned 🚀");
      loadAll();
    } catch {
      toast.error("Auto assign failed ❌");
    }
  };

  // ================= MANUAL ASSIGN =================
  const manualAssign = async (issueId, engineerId) => {
    try {
      await api.post(
        `/issues/${issueId}/assign`,
        { engineerId },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      toast.success("Engineer assigned ✅");
      loadAll();
    } catch {
      toast.error("Manual assign failed ❌");
    }
  };

  // ================= CREATE ENGINEER =================
  const createEngineer = async () => {
    try {
      if (!engineerForm.name || !engineerForm.email || !engineerForm.password) {
        toast.error("Fill all fields ⚠️");
        return;
      }

      await api.post("/users/create-engineer", engineerForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      toast.success("Engineer created 🚀");

      setEngineerForm({ name: "", email: "", password: "" });
      setShowAdd(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Creation failed ❌");
    }
  };

  // ================= CHART =================
  const chartData = stats && {
    labels: stats.byCategory.map((c) => c._id),
    datasets: [
      {
        label: "Issues",
        data: stats.byCategory.map((c) => c.count),
        backgroundColor: "#3b82f6",
        borderRadius: 12,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center text-lg">
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* ================= NAVBAR ================= */}
      <div className="sticky top-0 z-30 bg-black/40 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
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

            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              + Add Engineer
            </button>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="max-w-7xl mx-auto p-6 space-y-14">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Overview</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Stat title="Total Issues" value={stats.total} />
            <Stat title="In Progress" value={stats.inProgress} />
            <Stat title="Resolved" value={stats.resolved} />
          </div>
        </section>

        {/* Analytics */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            {chartData && (
              <div className="h-[300px]">
                <Bar data={chartData} />
              </div>
            )}
          </div>
        </section>

        {/* Issue Map */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Issue Map</h2>
          <IssueMap issues={issues} />
        </section>

        {/* Issue Management */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Issue Management</h2>

          <div className="max-h-[500px] overflow-y-auto pr-2 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <div
                key={issue._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:scale-[1.02] transition"
              >
                <h3 className="font-semibold text-lg mb-1">{issue.title}</h3>

                <p className="text-sm text-gray-400">{issue.status}</p>

                <p className="text-sm text-gray-400 mb-4">
                  Priority: {issue.priorityScore}
                </p>

                <div className="space-y-2">
                  <select
                    className="w-full bg-white/10 p-2 rounded"
                    defaultValue=""
                    onChange={(e) => manualAssign(issue._id, e.target.value)}
                  >
                    <option value="" disabled>
                      Assign Engineer
                    </option>

                    {engineers.map((eng) => (
                      <option key={eng._id} value={eng._id}>
                        {eng.email}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => autoAssign(issue._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
                  >
                    Auto Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Assignment History */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Assignment History</h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-black/60 backdrop-blur">
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="p-3 text-left">Issue</th>
                  <th className="p-3 text-left">Engineer</th>
                  <th className="p-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((h) => (
                  <tr
                    key={h._id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-3">{h.issueId?.title}</td>
                    <td className="p-3">{h.engineerId?.email}</td>
                    <td className="p-3">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================= Reusable ================= */

function Stat({ title, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}
