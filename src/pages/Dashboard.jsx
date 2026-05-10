import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { markAsRead } from "../api/notifications";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

const ITEMS_PER_PAGE = 6;

const STATUS = {
  REPORTED:    { label: "Reported",    color: "#71717a", bg: "rgba(113,113,122,0.12)" },
  VERIFIED:    { label: "Verified",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  RESOLVED:    { label: "Resolved",    color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};

/* ── SVG stat icons ── */
const StatIcon = {
  list: (color) => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  zap: (color) => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  check: (color) => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  alert: (color) => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

function getTimeRemaining(dueAt) {
  const diff = new Date(dueAt) - new Date();
  if (diff <= 0) return { text: "Overdue", color: "var(--red)", urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff / 1000) % 60);
  if (h < 6)  return { text: `${h}h ${m}m ${s}s`, color: "var(--red)",   urgent: true  };
  if (h < 24) return { text: `${h}h ${m}m`,       color: "var(--amber)", urgent: false };
  return         { text: `${h}h ${m}m`,            color: "var(--green)", urgent: false };
}

export default function Dashboard() {
  const [, forceUpdate]           = useState(0);
  const [issues, setIssues]       = useState([]);
  const [filter, setFilter]       = useState("ALL");
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("DESC");
  const [page, setPage]           = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [notifications, setNotifications]   = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comment, setComment]     = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const notifRef = useRef(null);

  // Live SLA timer
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { fetchIssues(false); const id = setInterval(() => fetchIssues(true), 5000); return () => clearInterval(id); }, []);
  useEffect(() => { setPage(1); }, [filter, search, sort]);
  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchIssues = async (silent = false) => {
    try {
      if (!silent) setInitialLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const [res, noti] = await Promise.all([
        api.get("/issues/engineers/me/issues", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/notifications",              { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setIssues(res.data); setNotifications(noti.data);
    } catch { toast.error("Failed to load issues"); }
    finally { if (!silent) setInitialLoading(false); }
  };

  const handleBellClick = async () => {
    const wasOpen = showNotifications;
    setShowNotifications(!wasOpen);
    if (!wasOpen) {
      const unread = notifications.filter((n) => !n.isRead);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      for (const n of unread) { try { await markAsRead(n._id); } catch {} }
    }
  };

  const updateStatus = async (id, status) => {
    if (loadingId) return;
    try {
      setLoadingId(id);
      const token = localStorage.getItem("token");
      const res = await api.patch(`/issues/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 200) { toast.success(`Marked as ${status}`); setIssues((prev) => prev.map((i) => i._id === id ? { ...i, status } : i)); }
    } catch { toast.error("Update failed"); }
    finally { setLoadingId(null); }
  };

  const openComments = async (issue) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/issues/${issue._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedIssue(res.data); setComment("");
    } catch { setSelectedIssue(issue); }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem("token");
      const res = await api.post(`/issues/${selectedIssue._id}/updates`, { message: comment }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Update posted");
      setComment("");
      setSelectedIssue((prev) => ({ ...prev, updates: [...(prev.updates || []), res.data] }));
      setIssues((prev) => prev.map((i) => i._id === selectedIssue._id ? { ...i, updates: [...(i.updates || []), res.data] } : i));
    } catch { toast.error("Failed to post update"); }
    finally { setSubmittingComment(false); }
  };

  const openInMaps = (issue) => {
    if (!issue.location?.coordinates) return;
    const [lng, lat] = issue.location.coordinates;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  const filtered = issues
    .filter((i) => filter === "ALL" || i.status === filter)
    .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) =>
    sort === "DESC" ? b.priorityScore - a.priorityScore : a.priorityScore - b.priorityScore
  );
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const overdue    = issues.filter((i) => i.dueAt && new Date(i.dueAt) < new Date() && i.status !== "RESOLVED").length;

  const stats = [
    { label: "Assigned",    value: issues.length,                                   accent: "var(--text)",      icon: StatIcon.list  },
    { label: "In Progress", value: issues.filter((i) => i.status==="IN_PROGRESS").length, accent: "var(--accent)", icon: StatIcon.zap   },
    { label: "Resolved",    value: issues.filter((i) => i.status==="RESOLVED").length,    accent: "var(--green)",  icon: StatIcon.check },
    { label: "Overdue",     value: overdue,                                          accent: "var(--red)",       icon: StatIcon.alert },
  ];

  if (initialLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading assignments…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Geist', sans-serif", color: "var(--text)" }}>
      <Navbar
        role="ENGINEER"
        notifications={notifications}
        onBellClick={handleBellClick}
        showNotifications={showNotifications}
        notifRef={notifRef}
      />

      {/* ── Update Modal ── */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 520, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Progress Updates</div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{selectedIssue.title}</div>
              </div>
              <button onClick={() => setSelectedIssue(null)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 22, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24, maxHeight: 340, overflowY: "auto" }}>
              {(!selectedIssue.updates || selectedIssue.updates.length === 0)
                ? <div style={{ color: "var(--text-3)", fontSize: 13, padding: "8px 0" }}>No updates yet. Be the first to post one.</div>
                : selectedIssue.updates.map((upd, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < selectedIssue.updates.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 4 }} />
                      {i < selectedIssue.updates.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--border)", minHeight: 20, margin: "4px 0" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{upd.message}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                        <span style={{ color: "var(--accent)", fontWeight: 500 }}>{upd.postedByName || "Engineer"}</span>
                        {" · "}{new Date(upd.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
              <label className="uw-label">Post update</label>
              <textarea className="uw-textarea" rows={3} placeholder="Describe current status or actions taken…" value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={submitComment} disabled={submittingComment || !comment.trim()} className="uw-btn-primary">
                  {submittingComment ? "Posting…" : "Post Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="uw-card" style={{ padding: 20, animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{s.label}</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon(s.accent)}
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.accent, letterSpacing: "-0.04em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["ALL","REPORTED","VERIFIED","IN_PROGRESS","RESOLVED"].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`filter-pill${filter === s ? " active" : ""}`}>
                {s.replace("_"," ")}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search issues…" value={search} onChange={(e) => setSearch(e.target.value)} className="uw-input" style={{ width: 200, paddingLeft: 32 }} />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="uw-select" style={{ width: 190 }}>
              <option value="DESC">Priority: High → Low</option>
              <option value="ASC">Priority: Low → High</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          <AnimatePresence>
            {paginated.map((issue, i) => {
              const sla = issue.dueAt ? getTimeRemaining(issue.dueAt) : null;
              const cfg = STATUS[issue.status] || STATUS.REPORTED;
              const updateCnt = issue.updates?.length || 0;
              return (
                <motion.div key={issue._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }} className="uw-card" style={{ padding: 20 }}>
                  {issue.photos?.length > 0 && (
                    <div style={{ height: 140, overflow: "hidden", borderRadius: 6, marginBottom: 16, position: "relative" }}>
                      <img src={issue.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} onClick={() => window.open(issue.photos[0])} />
                      {issue.photos.length > 1 && <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 4, fontSize: 11, color: "#fff" }}>+{issue.photos.length - 1}</div>}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{issue.title}</div>
                    <span className="uw-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                  </div>
                  {sla && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>SLA Remaining</span>
                        <span style={{ fontSize: 12, color: sla.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: sla.urgent ? 700 : 400 }}>
                          {sla.urgent && "⚠ "}{sla.text}
                        </span>
                      </div>
                      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "60%", background: sla.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[{ label: "Priority", value: issue.priorityScore }, { label: "Category", value: issue.category }].map((m) => (
                      <div key={m.label} style={{ background: "var(--bg-subtle)", padding: "8px 10px", borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {updateCnt > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--accent-lo)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, marginBottom: 12, fontSize: 12, color: "var(--accent)" }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {updateCnt} update{updateCnt !== 1 ? "s" : ""}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {issue.status === "REPORTED" && (
                      <button disabled={loadingId === issue._id} onClick={() => updateStatus(issue._id, "VERIFIED")} className="uw-btn-primary" style={{ width: "100%", justifyContent: "center" }}>Verify Issue</button>
                    )}
                    {issue.status === "VERIFIED" && (
                      <button disabled={loadingId === issue._id} onClick={() => updateStatus(issue._id, "IN_PROGRESS")} style={{ width: "100%", justifyContent: "center", height: 36, borderRadius: "var(--radius)", background: "var(--amber)", color: "#000", border: "none", fontFamily: "'Geist'", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Start Work
                      </button>
                    )}
                    {issue.status === "IN_PROGRESS" && (
                      <button disabled={loadingId === issue._id} onClick={() => updateStatus(issue._id, "RESOLVED")} style={{ width: "100%", justifyContent: "center", height: 36, borderRadius: "var(--radius)", background: "transparent", color: "var(--green)", border: "1px solid rgba(34,197,94,0.4)", fontFamily: "'Geist'", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--green-lo)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        Mark Resolved
                      </button>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button onClick={() => openComments(issue)} className="uw-btn-secondary" style={{ justifyContent: "center", fontSize: 12 }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {updateCnt > 0 ? `Updates (${updateCnt})` : "Add Update"}
                      </button>
                      <button onClick={() => openInMaps(issue)} className="uw-btn-secondary" style={{ justifyContent: "center", fontSize: 12 }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        View on Map
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {paginated.length === 0 && !initialLoading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No issues found</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Try adjusting your filters</div>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 36, alignItems: "center" }}>
            <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1} className="uw-btn-ghost" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>← Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i+1)} style={{ width: 32, height: 32, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: page === i+1 ? "var(--accent)" : "transparent", border: `1px solid ${page === i+1 ? "var(--accent)" : "var(--border)"}`, color: page === i+1 ? "#fff" : "var(--text-2)", fontFamily: "'Geist'", fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>{i+1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page === totalPages} className="uw-btn-ghost" style={{ height: 32, padding: "0 12px", fontSize: 12 }}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
