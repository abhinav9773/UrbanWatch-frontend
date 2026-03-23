import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { markAsRead } from "../api/notifications";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 6;

const ENG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
  * { box-sizing: border-box; }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 12px rgba(0,255,136,0.2)} 50%{box-shadow:0 0 28px rgba(0,255,136,0.5)} }
  @keyframes scanline { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .uw-card { background:rgba(0,255,136,0.02); border:1px solid rgba(0,255,136,0.1); position:relative; transition:border-color 0.3s,background 0.3s; }
  .uw-card::before { content:''; position:absolute; top:0; left:0; width:20px; height:1px; background:#00ff88; }
  .uw-card::after { content:''; position:absolute; top:0; left:0; width:1px; height:20px; background:#00ff88; }
  .uw-card-br { position:absolute; bottom:0; right:0; width:20px; height:1px; background:rgba(0,255,136,0.3); }
  .uw-card-br::after { content:''; position:absolute; right:0; bottom:0; width:1px; height:20px; background:rgba(0,255,136,0.3); }
  .uw-btn { background:#00ff88; color:#050a0f; border:none; padding:8px 16px; font-family:'Syne',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition:all 0.2s; }
  .uw-btn:hover:not(:disabled) { background:#00ffaa; transform:translateY(-1px); }
  .uw-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .uw-btn-yellow { background:#ffaa00; color:#050a0f; border:none; padding:8px 16px; font-family:'Syne',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%); transition:all 0.2s; }
  .uw-btn-yellow:hover:not(:disabled) { background:#ffc333; transform:translateY(-1px); }
  .uw-btn-yellow:disabled { opacity:0.4; cursor:not-allowed; }
  .uw-btn-resolve { background:transparent; color:#00ff88; border:1px solid rgba(0,255,136,0.3); padding:8px 16px; font-family:'Syne',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .uw-btn-resolve:hover:not(:disabled) { border-color:#00ff88; background:rgba(0,255,136,0.08); }
  .uw-btn-resolve:disabled { opacity:0.4; cursor:not-allowed; }
  .uw-btn-map { background:transparent; color:rgba(0,255,136,0.5); border:1px solid rgba(0,255,136,0.1); padding:8px 16px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; width:100%; }
  .uw-btn-map:hover { border-color:rgba(0,255,136,0.3); color:#00ff88; }
  .uw-btn-comment { background:transparent; color:rgba(0,153,255,0.7); border:1px solid rgba(0,153,255,0.2); padding:8px 16px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; width:100%; }
  .uw-btn-comment:hover { border-color:rgba(0,153,255,0.5); color:#0099ff; }
  .uw-btn-danger { background:transparent; color:#ff4466; border:1px solid rgba(255,68,102,0.3); padding:10px 20px; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .uw-btn-danger:hover { border-color:#ff4466; background:rgba(255,68,102,0.08); }
  .filter-pill { background:transparent; color:rgba(0,255,136,0.4); border:1px solid rgba(0,255,136,0.1); padding:6px 14px; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .filter-pill.active { background:rgba(0,255,136,0.1); color:#00ff88; border-color:rgba(0,255,136,0.3); }
  .filter-pill:hover { border-color:rgba(0,255,136,0.25); color:rgba(0,255,136,0.7); }
  .uw-input { background:rgba(0,255,136,0.03); border:1px solid rgba(0,255,136,0.15); color:#e0ffe8; padding:8px 14px; font-family:'DM Mono',monospace; font-size:12px; outline:none; transition:border-color 0.3s; }
  .uw-input:focus { border-color:#00ff88; }
  .uw-input::placeholder { color:rgba(0,255,136,0.2); }
  .uw-select { background:rgba(5,10,15,0.9); border:1px solid rgba(0,255,136,0.15); color:#e0ffe8; padding:8px 14px; font-family:'DM Mono',monospace; font-size:12px; outline:none; cursor:pointer; }
  .notification-item { padding:14px 16px; border-bottom:1px solid rgba(0,255,136,0.05); font-size:12px; transition:background 0.2s; cursor:pointer; }
  .notification-item:hover { background:rgba(0,255,136,0.03); }
  .notification-item.unread { background:rgba(0,255,136,0.05); border-left:2px solid #00ff88; }
  .scanline-global { position:fixed; left:0; right:0; top:0; height:3px; background:linear-gradient(90deg,transparent,rgba(0,255,136,0.06),transparent); animation:scanline 12s linear infinite; pointer-events:none; z-index:999; }
  .modal-overlay { position:fixed; inset:0; background:rgba(2,6,10,0.92); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(6px); }
  .modal-box { animation:modalIn 0.3s ease forwards; }
  .comment-input { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.3); color:#e0ffe8; padding:10px 14px; font-family:'DM Mono',monospace; font-size:12px; outline:none; resize:none; transition:border-color 0.25s; }
  .comment-input:focus { border-color:#00ff88; }
  .comment-input::placeholder { color:rgba(0,255,136,0.25); }
  .timeline-dot { width:8px; height:8px; background:#00ff88; border-radius:50%; flex-shrink:0; margin-top:3px; }
  .timeline-line { width:1px; background:rgba(0,255,136,0.15); flex:1; min-height:16px; margin-left:3px; }
`;

const STATUS_CONFIG = {
  REPORTED: { color: "#888", bg: "rgba(136,136,136,0.1)" },
  VERIFIED: { color: "#ffaa00", bg: "rgba(255,170,0,0.1)" },
  IN_PROGRESS: { color: "#0099ff", bg: "rgba(0,153,255,0.1)" },
  RESOLVED: { color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
};

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
  const [selectedIssue, setSelectedIssue] = useState(null); // for comment modal
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const notificationRef = useRef(null);
  const { logout, user } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchIssues(false);
    const interval = setInterval(() => fetchIssues(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

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

  const fetchIssues = async (isSilent = false) => {
    try {
      if (!isSilent) setInitialLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const [res, noti] = await Promise.all([
        api.get("/issues/engineers/me/issues", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setIssues(res.data);
      setNotifications(noti.data);
    } catch {
      toast.error("Failed to load issues ❌");
    } finally {
      if (!isSilent) setInitialLoading(false);
    }
  };

  const handleBellClick = async () => {
    const wasOpen = showNotifications;
    setShowNotifications(!wasOpen);
    if (!wasOpen) {
      const unreadNotifs = notifications.filter((n) => !n.isRead);
      if (unreadNotifs.length === 0) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      for (const n of unreadNotifs) {
        try {
          await markAsRead(n._id);
        } catch {}
      }
    }
  };

  const updateStatus = async (id, status) => {
    try {
      if (loadingId) return;
      setLoadingId(id);
      const token = localStorage.getItem("token");
      const res = await api.patch(
        `/issues/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
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

  // ✅ Open comment modal — fetch full issue with updates
  const openComments = async (issue) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/issues/${issue._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedIssue(res.data);
      setComment("");
    } catch {
      setSelectedIssue(issue);
    }
  };

  // ✅ Submit comment/update
  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/issues/${selectedIssue._id}/updates`,
        { message: comment },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Update posted ✅");
      setComment("");
      // Add new update to local state
      setSelectedIssue((prev) => ({
        ...prev,
        updates: [...(prev.updates || []), res.data],
      }));
      // Update the issue card to show update count
      setIssues((prev) =>
        prev.map((i) =>
          i._id === selectedIssue._id
            ? { ...i, updates: [...(i.updates || []), res.data] }
            : i,
        ),
      );
    } catch {
      toast.error("Failed to post update ❌");
    } finally {
      setSubmittingComment(false);
    }
  };

  const openInMaps = (issue) => {
    if (!issue.location?.coordinates) return;
    const [lng, lat] = issue.location.coordinates;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const getTimeRemaining = (dueAt) => {
    const diff = new Date(dueAt) - new Date();
    if (diff <= 0) return { text: "OVERDUE", color: "#ff4466", urgent: true };
    const h = Math.floor(diff / 3600000),
      m = Math.floor((diff % 3600000) / 60000),
      s = Math.floor((diff / 1000) % 60);
    if (h < 6)
      return { text: `${h}h ${m}m ${s}s`, color: "#ff4466", urgent: true };
    if (h < 24) return { text: `${h}h ${m}m`, color: "#ffaa00", urgent: false };
    return { text: `${h}h ${m}m`, color: "#00ff88", urgent: false };
  };

  const filtered = issues
    .filter((i) => (filter === "ALL" ? true : i.status === filter))
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) =>
    sort === "DESC"
      ? b.priorityScore - a.priorityScore
      : a.priorityScore - b.priorityScore,
  );
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );
  const unread = notifications.filter((n) => !n.isRead).length;

  if (initialLoading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{ENG_STYLES}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "1px solid rgba(0,255,136,0.3)",
              borderTop: "1px solid #00ff88",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              color: "rgba(0,255,136,0.5)",
              fontSize: "11px",
              letterSpacing: "0.2em",
            }}
          >
            FETCHING ASSIGNMENTS...
          </div>
        </div>
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
      <style>{ENG_STYLES}</style>
      <div className="scanline-global" />

      {/* NAVBAR */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(5,10,15,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,255,136,0.08)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              Field Engineer
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: "rgba(0,255,136,0.4)" }}>
              {user?.email}
            </span>
            <div style={{ position: "relative" }} ref={notificationRef}>
              <button
                onClick={handleBellClick}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,255,136,0.15)",
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
                    background: "#0a1a12",
                    border: "1px solid rgba(0,255,136,0.15)",
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(0,255,136,0.08)",
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(0,255,136,0.5)",
                    }}
                  >
                    // Notifications
                  </div>
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
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
                        className={`notification-item${!n.isRead ? " unread" : ""}`}
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
            <button onClick={logout} className="uw-btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ✅ COMMENT / UPDATE MODAL */}
      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div
            className="modal-box"
            style={{
              width: "540px",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#07120d",
              border: "1px solid rgba(0,153,255,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner accents in blue */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "28px",
                height: "1px",
                background: "#0099ff",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1px",
                height: "28px",
                background: "#0099ff",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "28px",
                height: "1px",
                background: "rgba(0,153,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "1px",
                height: "28px",
                background: "rgba(0,153,255,0.4)",
              }}
            />

            <div style={{ padding: "28px" }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      color: "rgba(0,153,255,0.6)",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    // Progress Updates
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "18px",
                      fontWeight: 800,
                      margin: 0,
                      color: "#e0ffe8",
                    }}
                  >
                    {selectedIssue.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(0,255,136,0.5)",
                    fontSize: "22px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Existing updates timeline */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    color: "rgba(0,255,136,0.4)",
                    textTransform: "uppercase",
                    marginBottom: "14px",
                  }}
                >
                  History
                </div>
                {(!selectedIssue.updates ||
                  selectedIssue.updates.length === 0) && (
                  <div
                    style={{
                      color: "rgba(0,255,136,0.25)",
                      fontSize: "12px",
                      padding: "12px",
                      background: "rgba(0,255,136,0.02)",
                      border: "1px solid rgba(0,255,136,0.06)",
                    }}
                  >
                    No updates posted yet. Be the first to add one.
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {selectedIssue.updates?.map((upd, i) => (
                    <div key={i} style={{ display: "flex", gap: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div className="timeline-dot" />
                        {i < selectedIssue.updates.length - 1 && (
                          <div className="timeline-line" />
                        )}
                      </div>
                      <div style={{ paddingBottom: "16px", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            marginBottom: "6px",
                            lineHeight: 1.5,
                          }}
                        >
                          {upd.message}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "rgba(0,255,136,0.35)",
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <span style={{ color: "#00ff88" }}>
                            {upd.postedByName || "Engineer"}
                          </span>
                          <span>·</span>
                          <span>
                            {new Date(upd.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "rgba(0,153,255,0.15)",
                  marginBottom: "20px",
                }}
              />

              {/* Post new update */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    color: "rgba(0,153,255,0.6)",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Post Update
                </div>
                <textarea
                  className="comment-input"
                  rows={3}
                  placeholder="Describe the current status, findings, or actions taken..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "10px",
                  }}
                >
                  <button
                    onClick={submitComment}
                    disabled={submittingComment || !comment.trim()}
                    style={{
                      background: comment.trim()
                        ? "#0099ff"
                        : "rgba(0,153,255,0.2)",
                      color: comment.trim() ? "#050a0f" : "rgba(0,153,255,0.4)",
                      border: "none",
                      padding: "10px 24px",
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: comment.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      clipPath:
                        "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                    }}
                  >
                    {submittingComment ? "Posting..." : "Post Update"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px" }}>
        {/* Quick stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Assigned", value: issues.length, accent: "#e0ffe8" },
            {
              label: "In Progress",
              value: issues.filter((i) => i.status === "IN_PROGRESS").length,
              accent: "#0099ff",
            },
            {
              label: "Resolved",
              value: issues.filter((i) => i.status === "RESOLVED").length,
              accent: "#00ff88",
            },
            {
              label: "Overdue",
              value: issues.filter(
                (i) =>
                  i.dueAt &&
                  new Date(i.dueAt) < new Date() &&
                  i.status !== "RESOLVED",
              ).length,
              accent: "#ff4466",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="uw-card"
              style={{
                padding: "20px",
                animationDelay: `${i * 0.08}s`,
                animation: "fadeUp 0.4s ease forwards",
                opacity: 0,
              }}
            >
              <div className="uw-card-br" />
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: "rgba(0,255,136,0.4)",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "32px",
                  fontWeight: 800,
                  color: s.accent,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "28px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["ALL", "REPORTED", "VERIFIED", "IN_PROGRESS", "RESOLVED"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`filter-pill${filter === s ? " active" : ""}`}
                >
                  {s.replace("_", " ")}
                </button>
              ),
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="uw-input"
              style={{ width: "200px" }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="uw-select"
            >
              <option value="DESC">High → Low priority</option>
              <option value="ASC">Low → High priority</option>
            </select>
          </div>
        </div>

        {/* Issue grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "16px",
          }}
        >
          <AnimatePresence>
            {paginated.map((issue, i) => {
              const sla = issue.dueAt ? getTimeRemaining(issue.dueAt) : null;
              const cfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.REPORTED;
              const updateCount = issue.updates?.length || 0;
              return (
                <motion.div
                  key={issue._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="uw-card"
                  style={{ padding: "22px" }}
                >
                  <div className="uw-card-br" />

                  {/* Photo */}
                  {issue.photos?.length > 0 && (
                    <div
                      style={{
                        marginBottom: "14px",
                        position: "relative",
                        height: "140px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={issue.photos[0]}
                        alt="Issue photo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          border: "1px solid rgba(0,255,136,0.1)",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(issue.photos[0])}
                      />
                      {issue.photos.length > 1 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "6px",
                            right: "6px",
                            background: "rgba(5,10,15,0.85)",
                            padding: "2px 8px",
                            fontSize: "10px",
                            color: "#00ff88",
                            letterSpacing: "0.08em",
                          }}
                        >
                          +{issue.photos.length - 1} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: "16px",
                        fontWeight: 700,
                        margin: 0,
                        flex: 1,
                        paddingRight: "8px",
                        lineHeight: 1.3,
                      }}
                    >
                      {issue.title}
                    </h3>
                    <span
                      style={{
                        padding: "3px 10px",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}33`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {issue.status}
                    </span>
                  </div>

                  {/* SLA */}
                  {sla && (
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.1em",
                            color: "rgba(0,255,136,0.4)",
                            textTransform: "uppercase",
                          }}
                        >
                          SLA
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: sla.color,
                            fontWeight: sla.urgent ? 500 : 400,
                          }}
                        >
                          {sla.urgent && "⚠ "}
                          {sla.text}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "2px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: sla.color,
                            width: "60%",
                            transition: "width 1s linear",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "18px",
                      fontSize: "11px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          color: "rgba(0,255,136,0.4)",
                          display: "block",
                          marginBottom: "2px",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Priority
                      </span>
                      <span>{issue.priorityScore}</span>
                    </div>
                    <div>
                      <span
                        style={{
                          color: "rgba(0,255,136,0.4)",
                          display: "block",
                          marginBottom: "2px",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Category
                      </span>
                      <span>{issue.category}</span>
                    </div>
                  </div>

                  {/* Updates count badge */}
                  {updateCount > 0 && (
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "6px 10px",
                        background: "rgba(0,153,255,0.06)",
                        border: "1px solid rgba(0,153,255,0.15)",
                        fontSize: "11px",
                        color: "rgba(0,153,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      💬 {updateCount} update{updateCount !== 1 ? "s" : ""}{" "}
                      posted
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {issue.status === "REPORTED" && (
                      <button
                        disabled={loadingId === issue._id}
                        onClick={() => updateStatus(issue._id, "VERIFIED")}
                        className="uw-btn"
                        style={{ width: "100%" }}
                      >
                        Verify Issue
                      </button>
                    )}
                    {issue.status === "VERIFIED" && (
                      <button
                        disabled={loadingId === issue._id}
                        onClick={() => updateStatus(issue._id, "IN_PROGRESS")}
                        className="uw-btn-yellow"
                        style={{ width: "100%" }}
                      >
                        Start Work
                      </button>
                    )}
                    {issue.status === "IN_PROGRESS" && (
                      <button
                        disabled={loadingId === issue._id}
                        onClick={() => updateStatus(issue._id, "RESOLVED")}
                        className="uw-btn-resolve"
                        style={{ width: "100%" }}
                      >
                        Mark Resolved ✓
                      </button>
                    )}
                    {/* ✅ Post Update button */}
                    <button
                      onClick={() => openComments(issue)}
                      className="uw-btn-comment"
                    >
                      💬{" "}
                      {updateCount > 0
                        ? `View / Add Updates (${updateCount})`
                        : "Post Update"}
                    </button>
                    <button
                      onClick={() => openInMaps(issue)}
                      className="uw-btn-map"
                    >
                      📍 View on Map
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "6px",
              marginTop: "40px",
            }}
          >
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    page === i + 1 ? "rgba(0,255,136,0.15)" : "transparent",
                  border:
                    page === i + 1
                      ? "1px solid rgba(0,255,136,0.4)"
                      : "1px solid rgba(0,255,136,0.1)",
                  color: page === i + 1 ? "#00ff88" : "rgba(0,255,136,0.4)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
