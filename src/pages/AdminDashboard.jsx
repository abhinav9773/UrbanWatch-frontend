import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import IssueMap from "../components/IssueMap";
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

const UW_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
  * { box-sizing: border-box; }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 12px rgba(0,255,136,0.2)} 50%{box-shadow:0 0 28px rgba(0,255,136,0.5)} }
  @keyframes scanline { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .uw-card { background:rgba(0,255,136,0.02); border:1px solid rgba(0,255,136,0.1); border-radius:0; position:relative; transition:border-color 0.3s,background 0.3s; animation:fadeUp 0.5s ease forwards; opacity:0; }
  .uw-card:hover { border-color:rgba(0,255,136,0.25); background:rgba(0,255,136,0.04); }
  .uw-card::before { content:''; position:absolute; top:0; left:0; width:24px; height:1px; background:#00ff88; }
  .uw-card::after { content:''; position:absolute; top:0; left:0; width:1px; height:24px; background:#00ff88; }
  .uw-card-br { position:absolute; bottom:0; right:0; width:24px; height:1px; background:rgba(0,255,136,0.3); }
  .uw-card-br::after { content:''; position:absolute; right:0; bottom:0; width:1px; height:24px; background:rgba(0,255,136,0.3); }
  .uw-btn { background:#00ff88; color:#050a0f; border:none; padding:11px 20px; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); transition:all 0.2s; }
  .uw-btn:hover { background:#00ffaa; transform:translateY(-1px); }
  .uw-btn-danger { background:transparent; color:#ff4466; border:1px solid rgba(255,68,102,0.4); padding:11px 20px; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .uw-btn-danger:hover { border-color:#ff4466; background:rgba(255,68,102,0.08); }
  .uw-btn-ghost { background:transparent; color:rgba(0,255,136,0.7); border:1px solid rgba(0,255,136,0.25); padding:11px 20px; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .uw-btn-ghost:hover { border-color:rgba(0,255,136,0.6); color:#00ff88; }
  .uw-btn-red { background:transparent; color:#ff4466; border:1px solid rgba(255,68,102,0.3); padding:6px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; }
  .uw-btn-red:hover { border-color:#ff4466; background:rgba(255,68,102,0.08); }
  .uw-field-label { font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.18em; color:#00ff88; text-transform:uppercase; margin-bottom:8px; }
  .uw-input { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.35); color:#e0ffe8; padding:12px 14px; font-family:'DM Mono',monospace; font-size:13px; outline:none; transition:all 0.25s; border-radius:0; }
  .uw-input:focus { border-color:#00ff88; background:#0f2418; box-shadow:0 0 0 1px rgba(0,255,136,0.2); }
  .uw-input::placeholder { color:rgba(0,255,136,0.25); font-size:12px; }
  .uw-input-sm { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.25); color:#e0ffe8; padding:9px 12px; font-family:'DM Mono',monospace; font-size:12px; outline:none; transition:all 0.25s; border-radius:0; }
  .uw-input-sm:focus { border-color:#00ff88; }
  .uw-input-sm::placeholder { color:rgba(0,255,136,0.2); }
  .uw-select { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.35); color:#e0ffe8; padding:11px 14px; font-family:'DM Mono',monospace; font-size:12px; outline:none; cursor:pointer; transition:all 0.25s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300ff88' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .uw-select:focus { border-color:#00ff88; }
  .uw-select option { background:#0d1f14; color:#e0ffe8; }
  .uw-tag { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; }
  .uw-row:hover { background:rgba(0,255,136,0.03); }
  .scanline-global { position:fixed; left:0; right:0; top:0; height:3px; background:linear-gradient(90deg,transparent,rgba(0,255,136,0.06),transparent); animation:scanline 12s linear infinite; pointer-events:none; z-index:999; }
  .section-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,255,136,0.4); margin-bottom:16px; display:flex; align-items:center; gap:12px; }
  .section-label::after { content:''; flex:1; height:1px; background:rgba(0,255,136,0.1); }
  .section-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#e0ffe8; margin-bottom:24px; }
  .filter-pill { background:transparent; color:rgba(0,255,136,0.4); border:1px solid rgba(0,255,136,0.1); padding:5px 12px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .filter-pill.active { background:rgba(0,255,136,0.1); color:#00ff88; border-color:rgba(0,255,136,0.3); }
  .filter-pill:hover { border-color:rgba(0,255,136,0.3); color:rgba(0,255,136,0.7); }
  .modal-overlay { position:fixed; inset:0; background:rgba(2,6,10,0.92); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(6px); }
  .modal-box { animation:modalIn 0.3s ease forwards; }
  .notif-item { padding:12px 16px; border-bottom:1px solid rgba(0,255,136,0.05); font-size:12px; transition:background 0.2s; }
  .notif-item.unread { border-left:2px solid #00ff88; background:rgba(0,255,136,0.03); }
  .assigned-badge { padding:10px 14px; background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.15); display:flex; align-items:center; gap:10px; }
`;

const STATUS_CONFIG = {
  REPORTED: { color: "#888", bg: "rgba(136,136,136,0.1)", label: "Reported" },
  VERIFIED: { color: "#ffaa00", bg: "rgba(255,170,0,0.1)", label: "Verified" },
  IN_PROGRESS: {
    color: "#0099ff",
    bg: "rgba(0,153,255,0.1)",
    label: "In Progress",
  },
  RESOLVED: { color: "#00ff88", bg: "rgba(0,255,136,0.1)", label: "Resolved" },
};

const CATEGORIES = ["ALL", "ROAD", "WATER", "LIGHTING", "SANITATION", "OTHER"];

const ENGINEER_FIELDS = [
  {
    key: "name",
    label: "Full Name",
    type: "text",
    ph: "e.g. Rahul Sharma",
    icon: "👤",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    ph: "engineer@urbanwatch.com",
    icon: "📧",
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    ph: "Min 8 characters",
    icon: "🔒",
  },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [wardFilter, setWardFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("priority");
  const [engineerForm, setEngineerForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [wardForm, setWardForm] = useState({ name: "", number: "", area: "" });
  const [wards, setWards] = useState([]);
  const [creating, setCreating] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    let filtered = [...issues];
    if (wardFilter)
      filtered = filtered.filter((i) => i.wardId?.toString() === wardFilter);
    if (categoryFilter !== "ALL")
      filtered = filtered.filter((i) => i.category === categoryFilter);
    if (statusFilter !== "ALL")
      filtered = filtered.filter((i) => i.status === statusFilter);
    if (sortBy === "upvotes")
      filtered.sort(
        (a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0),
      );
    else filtered.sort((a, b) => b.priorityScore - a.priorityScore);
    setFilteredIssues(filtered);
  }, [issues, wardFilter, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      )
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getToken = () => localStorage.getItem("token");

  const loadAll = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [i, w, h, s, e, n, wa] = await Promise.all([
        api.get("/issues", { headers }),
        api.get("/assignments/workload", { headers }),
        api.get("/assignments/history", { headers }),
        api.get("/stats", { headers }),
        api.get("/users?role=ENGINEER", { headers }),
        api.get("/notifications", { headers }),
        api.get("/wards", { headers }),
      ]);
      setIssues(i.data);
      setWorkload(w.data);
      setHistory(h.data);
      setStats(s.data);
      setEngineers(e.data);
      setNotifications(n.data);
      setWards(wa.data);
    } catch {
      toast.error("Failed to load admin data ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark notifications as read on bell open
  const handleBellClick = async () => {
    const wasOpen = showNotifications;
    setShowNotifications(!wasOpen);
    if (!wasOpen) {
      const unreadNotifs = notifications.filter((n) => !n.isRead);
      if (unreadNotifs.length === 0) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      for (const n of unreadNotifs) {
        try {
          await api.patch(
            `/notifications/${n._id}/read`,
            {},
            { headers: { Authorization: `Bearer ${getToken()}` } },
          );
        } catch {}
      }
    }
  };

  const autoAssign = async (id) => {
    try {
      await api.post(
        `/issues/${id}/auto-assign`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast.success("Auto assigned 🚀");
      loadAll();
    } catch {
      toast.error("Auto assign failed ❌");
    }
  };

  const manualAssign = async (issueId, engineerId) => {
    if (!engineerId) return;
    try {
      await api.post(
        `/issues/${issueId}/assign`,
        { engineerId },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast.success("Engineer assigned ✅");
      loadAll();
    } catch {
      toast.error("Manual assign failed ❌");
    }
  };

  const createEngineer = async () => {
    try {
      if (!engineerForm.name || !engineerForm.email || !engineerForm.password) {
        toast.error("Fill all fields ⚠️");
        return;
      }
      setCreating(true);
      await api.post("/users/create-engineer", engineerForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Engineer created 🚀");
      setEngineerForm({ name: "", email: "", password: "" });
      setShowAdd(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Creation failed ❌");
    } finally {
      setCreating(false);
    }
  };

  const createWard = async () => {
    try {
      if (!wardForm.name || !wardForm.number) {
        toast.error("Name and number required");
        return;
      }
      await api.post("/wards", wardForm, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Ward created ✅");
      setWardForm({ name: "", number: "", area: "" });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ward");
    }
  };

  const deleteWard = async (id) => {
    try {
      await api.delete(`/wards/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Ward deleted");
      loadAll();
    } catch {
      toast.error("Failed to delete ward");
    }
  };

  const chartData = stats && {
    labels: stats.byCategory.map((c) => c._id),
    datasets: [
      {
        label: "Issues",
        data: stats.byCategory.map((c) => c.count),
        backgroundColor: "rgba(0,255,136,0.5)",
        borderColor: "#00ff88",
        borderWidth: 1,
        borderRadius: 0,
        hoverBackgroundColor: "rgba(0,255,136,0.8)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#07120d",
        borderColor: "#00ff88",
        borderWidth: 1,
        titleColor: "#00ff88",
        bodyColor: "#e0ffe8",
        titleFont: { family: "DM Mono" },
        bodyFont: { family: "DM Mono" },
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,255,136,0.05)" },
        ticks: {
          color: "rgba(0,255,136,0.5)",
          font: { family: "DM Mono", size: 11 },
        },
      },
      y: {
        grid: { color: "rgba(0,255,136,0.05)" },
        ticks: {
          color: "rgba(0,255,136,0.5)",
          font: { family: "DM Mono", size: 11 },
        },
      },
    },
  };

  const unread = notifications.filter((n) => !n.isRead).length;
  const navItems = [
    "overview",
    "issues",
    "engineers",
    "wards",
    "map",
    "history",
  ];
  const passwordStrength =
    engineerForm.password.length === 0
      ? 0
      : engineerForm.password.length < 6
        ? 1
        : engineerForm.password.length < 10
          ? 2
          : 3;
  const strengthColor = ["transparent", "#ff4466", "#ffaa00", "#00ff88"][
    passwordStrength
  ];

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <style>{UW_STYLES}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "1px solid rgba(0,255,136,0.3)",
              borderTop: "1px solid #00ff88",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              color: "rgba(0,255,136,0.6)",
              fontSize: "12px",
              letterSpacing: "0.2em",
            }}
          >
            LOADING SYSTEM DATA...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        fontFamily: "'DM Mono', monospace",
        color: "#e0ffe8",
      }}
    >
      <style>{UW_STYLES}</style>
      <div className="scanline-global" />

      {/* NAVBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(5,10,15,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,255,136,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "1px solid #00ff88",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    background: "#00ff88",
                    animation: "glowPulse 2s ease infinite",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "16px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                }}
              >
                URBAN<span style={{ color: "#00ff88" }}>WATCH</span>
              </span>
            </div>
            <div
              style={{
                width: "1px",
                height: "24px",
                background: "rgba(0,255,136,0.15)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.15em",
                color: "rgba(0,255,136,0.5)",
                textTransform: "uppercase",
              }}
            >
              Admin Console
            </span>
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveSection(item)}
                style={{
                  background:
                    activeSection === item
                      ? "rgba(0,255,136,0.1)"
                      : "transparent",
                  color:
                    activeSection === item ? "#00ff88" : "rgba(0,255,136,0.4)",
                  border:
                    activeSection === item
                      ? "1px solid rgba(0,255,136,0.2)"
                      : "1px solid transparent",
                  padding: "6px 14px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }} ref={notificationRef}>
              <button
                onClick={handleBellClick}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,255,136,0.2)",
                  color: "#00ff88",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                🔔
                {unread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      background: "#ff4466",
                      color: "white",
                      fontSize: "9px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: "320px",
                    background: "#07120d",
                    border: "1px solid rgba(0,255,136,0.2)",
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(0,255,136,0.08)",
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(0,255,136,0.6)",
                    }}
                  >
                    // Notifications
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 && (
                      <p
                        style={{
                          padding: "16px",
                          color: "rgba(0,255,136,0.3)",
                          fontSize: "12px",
                        }}
                      >
                        No notifications
                      </p>
                    )}
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`notif-item${!n.isRead ? " unread" : ""}`}
                      >
                        <div style={{ marginBottom: "4px" }}>{n.message}</div>
                        <div
                          style={{
                            color: "rgba(0,255,136,0.3)",
                            fontSize: "10px",
                          }}
                        >
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setShowAdd(true)} className="uw-btn">
              + Engineer
            </button>
            <button onClick={logout} className="uw-btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ADD ENGINEER MODAL */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div
            className="modal-box"
            style={{
              width: "460px",
              background: "#07120d",
              border: "1px solid rgba(0,255,136,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "32px",
                height: "1px",
                background: "#00ff88",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1px",
                height: "32px",
                background: "#00ff88",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "32px",
                height: "1px",
                background: "rgba(0,255,136,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "1px",
                height: "32px",
                background: "rgba(0,255,136,0.4)",
              }}
            />
            <div style={{ padding: "32px" }}>
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.25em",
                    color: "rgba(0,255,136,0.5)",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "4px",
                      height: "4px",
                      background: "#00ff88",
                      borderRadius: "50%",
                      animation: "glowPulse 2s ease infinite",
                    }}
                  />
                  // New Engineer
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "26px",
                      fontWeight: 800,
                      margin: 0,
                    }}
                  >
                    Add Engineer
                  </h2>
                  <button
                    onClick={() => setShowAdd(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,68,102,0.3)",
                      color: "#ff4466",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {ENGINEER_FIELDS.map((f) => (
                  <div key={f.key}>
                    <div
                      className="uw-field-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>{f.icon}</span>
                      {f.label}
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={f.type}
                        placeholder={f.ph}
                        className="uw-input"
                        value={engineerForm[f.key]}
                        onChange={(e) =>
                          setEngineerForm({
                            ...engineerForm,
                            [f.key]: e.target.value,
                          })
                        }
                        onFocus={() => setFocusedField(f.key)}
                        onBlur={() => setFocusedField(null)}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          height: "1px",
                          background: "#00ff88",
                          width: focusedField === f.key ? "100%" : "0%",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    {f.key === "password" && engineerForm.password && (
                      <div style={{ marginTop: "8px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            marginBottom: "4px",
                          }}
                        >
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: "2px",
                                background:
                                  i <= passwordStrength
                                    ? strengthColor
                                    : "rgba(255,255,255,0.08)",
                                transition: "background 0.3s",
                              }}
                            />
                          ))}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: strengthColor,
                            letterSpacing: "0.1em",
                          }}
                        >
                          {
                            [
                              "",
                              "Weak — add more characters",
                              "Moderate — try adding symbols",
                              "Strong ✓",
                            ][passwordStrength]
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  margin: "24px 0",
                  padding: "12px 14px",
                  background: "rgba(0,153,255,0.05)",
                  border: "1px solid rgba(0,153,255,0.15)",
                  fontSize: "11px",
                  color: "rgba(0,200,255,0.7)",
                  lineHeight: 1.6,
                }}
              >
                ℹ️ Engineer will receive login credentials and can access the
                field engineer dashboard.
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowAdd(false)}
                  className="uw-btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={createEngineer}
                  disabled={creating}
                  className="uw-btn"
                  style={{
                    flex: 2,
                    clipPath:
                      "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? "Creating..." : "Create Engineer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 32px" }}
      >
        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// System Overview</div>
            <div className="section-title">Dashboard</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "40px",
              }}
            >
              {[
                {
                  label: "Total Issues",
                  value: stats?.total,
                  accent: "#00ff88",
                },
                {
                  label: "In Progress",
                  value: stats?.inProgress,
                  accent: "#0099ff",
                },
                {
                  label: "Resolved",
                  value: stats?.resolved,
                  accent: "#ffaa00",
                },
                {
                  label: "Total Upvotes",
                  value: issues.reduce(
                    (acc, i) => acc + (i.upvotes?.length || 0),
                    0,
                  ),
                  accent: "#ff88cc",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="uw-card"
                  style={{ padding: "28px", animationDelay: `${i * 0.1}s` }}
                >
                  <div className="uw-card-br" />
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      color: "rgba(0,255,136,0.4)",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "48px",
                      fontWeight: 800,
                      color: s.accent,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="uw-card" style={{ padding: "28px" }}>
              <div className="uw-card-br" />
              <div className="section-label">// Issues by Category</div>
              {chartData && (
                <div style={{ height: "280px" }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ISSUES — ✅ shows engineer name, hides assign if already assigned */}
        {activeSection === "issues" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// Issue Management</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div className="section-title" style={{ margin: 0 }}>
                All Issues{" "}
                <span
                  style={{ color: "rgba(0,255,136,0.4)", fontSize: "16px" }}
                >
                  ({filteredIssues.length})
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* ✅ Ward filter using real ward data */}
                {wards.length > 0 && (
                  <select
                    className="uw-select"
                    style={{ width: "180px" }}
                    value={wardFilter}
                    onChange={(e) => setWardFilter(e.target.value)}
                  >
                    <option value="">All Wards</option>
                    {wards.map((w) => (
                      <option key={w._id} value={w._id}>
                        Ward {w.number} — {w.name}
                      </option>
                    ))}
                  </select>
                )}
                <div style={{ display: "flex", gap: "4px" }}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={`filter-pill${categoryFilter === c ? " active" : ""}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <select
                  className="uw-select"
                  style={{ width: "140px" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  {["REPORTED", "VERIFIED", "IN_PROGRESS", "RESOLVED"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
                <select
                  className="uw-select"
                  style={{ width: "160px" }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="priority">Sort: Priority</option>
                  <option value="upvotes">Sort: Most Upvoted</option>
                </select>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredIssues.map((issue, i) => {
                const cfg =
                  STATUS_CONFIG[issue.status] || STATUS_CONFIG.REPORTED;
                return (
                  <div
                    key={issue._id}
                    className="uw-card"
                    style={{ padding: "24px", animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="uw-card-br" />
                    {issue.photos?.length > 0 && (
                      <div
                        style={{
                          marginBottom: "14px",
                          height: "100px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={issue.photos[0]}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            border: "1px solid rgba(0,255,136,0.1)",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(issue.photos[0])}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: "15px",
                          fontWeight: 700,
                          margin: 0,
                          flex: 1,
                          paddingRight: "8px",
                        }}
                      >
                        {issue.title}
                      </h3>
                      <span
                        className="uw-tag"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}33`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "11px",
                        color: "rgba(0,255,136,0.4)",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>P: {issue.priorityScore}</span>
                      <span>·</span>
                      <span>{issue.category}</span>
                      {issue.upvotes?.length > 0 && (
                        <>
                          <span>·</span>
                          <span style={{ color: "#ff88cc" }}>
                            ▲ {issue.upvotes.length}
                          </span>
                        </>
                      )}
                      {issue.updates?.length > 0 && (
                        <>
                          <span>·</span>
                          <span style={{ color: "#0099ff" }}>
                            💬 {issue.updates.length}
                          </span>
                        </>
                      )}
                    </div>

                    {/* ✅ Show engineer if assigned, hide controls if assigned */}
                    {issue.assignedEngineer ? (
                      <div className="assigned-badge">
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#00ff88",
                            flexShrink: 0,
                            animation: "glowPulse 2s ease infinite",
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: "9px",
                              color: "rgba(0,255,136,0.4)",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              marginBottom: "2px",
                            }}
                          >
                            Assigned to
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#00ff88",
                              fontFamily: "'Syne', sans-serif",
                              fontWeight: 700,
                            }}
                          >
                            {issue.assignedEngineer.name ||
                              issue.assignedEngineer.email}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "rgba(0,255,136,0.4)",
                            }}
                          >
                            {issue.assignedEngineer.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <select
                          className="uw-select"
                          defaultValue=""
                          onChange={(e) =>
                            manualAssign(issue._id, e.target.value)
                          }
                        >
                          <option value="" disabled>
                            — Assign Engineer —
                          </option>
                          {engineers.map((eng) => (
                            <option key={eng._id} value={eng._id}>
                              {eng.name || eng.email}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => autoAssign(issue._id)}
                          className="uw-btn"
                          style={{
                            width: "100%",
                            clipPath:
                              "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                          }}
                        >
                          Auto Assign
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ENGINEERS */}
        {activeSection === "engineers" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// Engineer Workload</div>
            <div className="section-title">Team Overview</div>
            <div className="uw-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="uw-card-br" />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
                    {["Engineer", "Active Issues", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "16px 20px",
                          textAlign: "left",
                          fontSize: "10px",
                          letterSpacing: "0.15em",
                          color: "rgba(0,255,136,0.4)",
                          textTransform: "uppercase",
                          fontWeight: 400,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workload.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "24px",
                          color: "rgba(0,255,136,0.3)",
                          fontSize: "12px",
                        }}
                      >
                        No workload data
                      </td>
                    </tr>
                  )}
                  {workload.map((w, i) => {
                    const count = w.activeCount || w.count || w.total || 0;
                    return (
                      <tr
                        key={i}
                        className="uw-row"
                        style={{
                          borderBottom: "1px solid rgba(0,255,136,0.05)",
                        }}
                      >
                        <td style={{ padding: "16px 20px", fontSize: "13px" }}>
                          {w.email || w.engineer?.email || "Unknown"}
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: "2px",
                                background: "rgba(0,255,136,0.1)",
                                maxWidth: "120px",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.min(count * 10, 100)}%`,
                                  background:
                                    count > 5
                                      ? "#ff4466"
                                      : count > 3
                                        ? "#ffaa00"
                                        : "#00ff88",
                                  transition: "width 0.6s ease",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 700,
                                color: "#00ff88",
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          <span
                            className="uw-tag"
                            style={{
                              background: "rgba(0,255,136,0.08)",
                              color: "#00ff88",
                              border: "1px solid rgba(0,255,136,0.2)",
                            }}
                          >
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ WARDS SECTION */}
        {activeSection === "wards" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// Ward Management</div>
            <div className="section-title">
              Wards{" "}
              <span style={{ color: "rgba(0,255,136,0.4)", fontSize: "16px" }}>
                ({wards.length})
              </span>
            </div>

            {/* Create ward form */}
            <div
              className="uw-card"
              style={{ padding: "24px", marginBottom: "24px" }}
            >
              <div className="uw-card-br" />
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.2em",
                  color: "rgba(0,255,136,0.5)",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                // Add New Ward
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 2fr auto",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <div>
                  <div className="uw-field-label">Ward No.</div>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    className="uw-input-sm"
                    value={wardForm.number}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <div className="uw-field-label">Ward Name</div>
                  <input
                    type="text"
                    placeholder="e.g. Karol Bagh"
                    className="uw-input-sm"
                    value={wardForm.name}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <div className="uw-field-label">Area / Zone</div>
                  <input
                    type="text"
                    placeholder="e.g. Central Delhi"
                    className="uw-input-sm"
                    value={wardForm.area}
                    onChange={(e) =>
                      setWardForm({ ...wardForm, area: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={createWard}
                  className="uw-btn"
                  style={{ whiteSpace: "nowrap" }}
                >
                  + Add Ward
                </button>
              </div>
            </div>

            {/* Wards list */}
            <div className="uw-card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="uw-card-br" />
              {wards.length === 0 && (
                <div
                  style={{
                    padding: "32px",
                    color: "rgba(0,255,136,0.3)",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  No wards created yet. Add one above.
                </div>
              )}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {wards.length > 0 && (
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}
                    >
                      {["No.", "Name", "Area", "Issues", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "14px 20px",
                            textAlign: "left",
                            fontSize: "10px",
                            letterSpacing: "0.15em",
                            color: "rgba(0,255,136,0.4)",
                            textTransform: "uppercase",
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {wards.map((ward) => {
                    const wardIssueCount = issues.filter(
                      (i) => i.wardId?.toString() === ward._id.toString(),
                    ).length;
                    return (
                      <tr
                        key={ward._id}
                        className="uw-row"
                        style={{
                          borderBottom: "1px solid rgba(0,255,136,0.05)",
                        }}
                      >
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            style={{
                              fontFamily: "'Syne', sans-serif",
                              fontWeight: 700,
                              color: "#00ff88",
                              fontSize: "16px",
                            }}
                          >
                            {ward.number}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "13px" }}>
                          {ward.name}
                        </td>
                        <td
                          style={{
                            padding: "14px 20px",
                            fontSize: "12px",
                            color: "rgba(0,255,136,0.5)",
                          }}
                        >
                          {ward.area || "—"}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            className="uw-tag"
                            style={{
                              background:
                                wardIssueCount > 0
                                  ? "rgba(255,170,0,0.1)"
                                  : "rgba(0,255,136,0.05)",
                              color:
                                wardIssueCount > 0
                                  ? "#ffaa00"
                                  : "rgba(0,255,136,0.4)",
                              border: `1px solid ${wardIssueCount > 0 ? "rgba(255,170,0,0.2)" : "rgba(0,255,136,0.1)"}`,
                            }}
                          >
                            {wardIssueCount} issue
                            {wardIssueCount !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <button
                            onClick={() => deleteWard(ward._id)}
                            className="uw-btn-red"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "map" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// Geographic View</div>
            <div className="section-title">Issue Map</div>
            <div
              className="uw-card"
              style={{ padding: "4px", overflow: "hidden" }}
            >
              <div className="uw-card-br" />
              <IssueMap issues={filteredIssues} />
            </div>
          </div>
        )}

        {activeSection === "history" && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <div className="section-label">// Assignment Log</div>
            <div className="section-title">History</div>
            <div
              className="uw-card"
              style={{
                padding: 0,
                overflow: "hidden",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              <div className="uw-card-br" />
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#050a0f",
                    zIndex: 1,
                  }}
                >
                  <tr style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
                    {["Issue", "Engineer", "Timestamp"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "16px 20px",
                          textAlign: "left",
                          fontSize: "10px",
                          letterSpacing: "0.15em",
                          color: "rgba(0,255,136,0.4)",
                          textTransform: "uppercase",
                          fontWeight: 400,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h._id}
                      className="uw-row"
                      style={{ borderBottom: "1px solid rgba(0,255,136,0.05)" }}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "13px" }}>
                        {h.issueId?.title}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: "12px",
                          color: "rgba(0,255,136,0.6)",
                        }}
                      >
                        {h.engineerId?.email}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: "11px",
                          color: "rgba(0,255,136,0.35)",
                        }}
                      >
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
