import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import IssueMap from "../components/IssueMap";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import Navbar from "../components/Navbar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ─── Icon set (all SVG, no emoji) ─── */
const Icon = {
  clipboard: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round"/>
    </svg>
  ),
  zap: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowUp: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 19V6M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  map: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  alert: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
    </svg>
  ),
  ward: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  history: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <polyline points="12 8 12 12 14 14"/>
      <path d="M3.05 11a9 9 0 1 0 .5-2M3 4v5h5"/>
    </svg>
  ),
};

const STATUS = {
  REPORTED:    { label: "Reported",    color: "#71717a", bg: "rgba(113,113,122,0.12)" },
  VERIFIED:    { label: "Verified",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  RESOLVED:    { label: "Resolved",    color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};

const CATEGORIES = ["ALL","ROAD","WATER","LIGHTING","SANITATION","OTHER"];
const ENG_FIELDS = [
  { key: "name",     label: "Full name",  type: "text",     ph: "e.g. Rahul Sharma" },
  { key: "email",    label: "Email",       type: "email",    ph: "engineer@city.gov"  },
  { key: "password", label: "Password",    type: "password", ph: "Min 8 characters"   },
];

function StatCard({ label, value, accent, delay = 0, icon, sub }) {
  return (
    <div className="uw-card" style={{ padding: 20, animation: `fadeUp 0.4s ease ${delay}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{label}</div>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: accent, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value ?? "—"}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [engineers, setEngineers]       = useState([]);
  const [issues, setIssues]             = useState([]);
  const [filteredIssues, setFiltered]   = useState([]);
  const [workload, setWorkload]         = useState([]);
  const [history, setHistory]           = useState([]);
  const [stats, setStats]               = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [wards, setWards]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [wardFilter, setWardFilter]     = useState("");
  const [categoryFilter, setCategory]   = useState("ALL");
  const [statusFilter, setStatus]       = useState("ALL");
  const [sortBy, setSortBy]             = useState("priority");
  const [engForm, setEngForm]           = useState({ name: "", email: "", password: "" });
  const [wardForm, setWardForm]         = useState({ name: "", number: "", area: "" });
  const [creating, setCreating]         = useState(false);
  const notifRef = useRef(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    let f = [...issues];
    if (wardFilter)              f = f.filter((i) => i.wardId?.toString() === wardFilter);
    if (categoryFilter !== "ALL") f = f.filter((i) => i.category === categoryFilter);
    if (statusFilter !== "ALL")   f = f.filter((i) => i.status === statusFilter);
    f.sort((a, b) =>
      sortBy === "upvotes"
        ? (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
        : b.priorityScore - a.priorityScore
    );
    setFiltered(f);
  }, [issues, wardFilter, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const h = { headers: headers() };
      const [i, w, hi, s, e, n, wa] = await Promise.all([
        api.get("/issues", h), api.get("/assignments/workload", h),
        api.get("/assignments/history", h), api.get("/stats", h),
        api.get("/users?role=ENGINEER", h), api.get("/notifications", h),
        api.get("/wards", h),
      ]);
      setIssues(i.data); setWorkload(w.data); setHistory(hi.data);
      setStats(s.data); setEngineers(e.data); setNotifications(n.data); setWards(wa.data);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const handleBellClick = async () => {
    const wasOpen = showNotifications;
    setShowNotifications(!wasOpen);
    if (!wasOpen) {
      const unread = notifications.filter((n) => !n.isRead);
      if (!unread.length) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      for (const n of unread) { try { await api.patch(`/notifications/${n._id}/read`, {}, { headers: headers() }); } catch {} }
    }
  };

  const autoAssign = async (id) => {
    try { await api.post(`/issues/${id}/auto-assign`, {}, { headers: headers() }); toast.success("Auto-assigned"); loadAll(); }
    catch { toast.error("Auto-assign failed"); }
  };

  const manualAssign = async (issueId, engineerId) => {
    if (!engineerId) return;
    try { await api.post(`/issues/${issueId}/assign`, { engineerId }, { headers: headers() }); toast.success("Engineer assigned"); loadAll(); }
    catch { toast.error("Assignment failed"); }
  };

  const createEngineer = async () => {
    if (!engForm.name || !engForm.email || !engForm.password) { toast.error("Fill all fields"); return; }
    try {
      setCreating(true);
      await api.post("/users/create-engineer", engForm, { headers: headers() });
      toast.success("Engineer created");
      setEngForm({ name: "", email: "", password: "" });
      setShowAdd(false); loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setCreating(false); }
  };

  const createWard = async () => {
    if (!wardForm.name || !wardForm.number) { toast.error("Name and number required"); return; }
    try { await api.post("/wards", wardForm, { headers: headers() }); toast.success("Ward created"); setWardForm({ name: "", number: "", area: "" }); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const deleteWard = async (id) => {
    try { await api.delete(`/wards/${id}`, { headers: headers() }); toast.success("Deleted"); loadAll(); }
    catch { toast.error("Delete failed"); }
  };

  const pwStrength = engForm.password.length === 0 ? 0 : engForm.password.length < 6 ? 1 : engForm.password.length < 10 ? 2 : 3;
  const pwColors   = ["transparent","#ef4444","#f59e0b","#22c55e"];

  const chartData = stats && {
    labels: stats.byCategory.map((c) => c._id),
    datasets: [{
      label: "Issues",
      data: stats.byCategory.map((c) => c.count),
      backgroundColor: "rgba(59,130,246,0.35)",
      borderColor: "#3b82f6", borderWidth: 1, borderRadius: 4,
      hoverBackgroundColor: "rgba(59,130,246,0.65)",
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "var(--bg-card)", borderColor: "var(--border)", borderWidth: 1,
        titleColor: "var(--text)", bodyColor: "var(--text-2)",
        titleFont: { family: "Geist" }, bodyFont: { family: "Geist" }, padding: 10,
      },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "var(--text-3)", font: { family: "Geist", size: 12 } } },
      y: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "var(--text-3)", font: { family: "Geist", size: 12 } } },
    },
  };

  const navTabs = ["overview","issues","engineers","wards","map","history"];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading system…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Geist', sans-serif", color: "var(--text)" }}>
      <Navbar
        role="ADMIN" tabs={navTabs} activeTab={activeSection} onTabChange={setActiveSection}
        notifications={notifications} onBellClick={handleBellClick}
        showNotifications={showNotifications} notifRef={notifRef}
        actions={
          <button onClick={() => setShowAdd(true)} className="uw-btn-primary">
            {Icon.plus} Add Engineer
          </button>
        }
      />

      {/* ── Add Engineer Modal ── z-index 9999 overrides map ── */}
      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-box" style={{
            width: 440, background: "var(--bg-card)",
            border: "1px solid var(--border)", borderRadius: 12,
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Add Field Engineer</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Create a new engineer account with access to the field dashboard</div>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {ENG_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="uw-label">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} className="uw-input"
                    value={engForm[f.key]} onChange={(e) => setEngForm({ ...engForm, [f.key]: e.target.value })} />
                  {f.key === "password" && engForm.password.length > 0 && (
                    <div style={{ marginTop: 7 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3].map((i) => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength ? pwColors[pwStrength] : "var(--border)", transition: "background 0.2s" }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: pwColors[pwStrength] }}>{["","Weak","Fair","Strong"][pwStrength]}</div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ padding: "10px 14px", background: "var(--accent-lo)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                This engineer will be able to log in and update issue statuses from their field dashboard.
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)} className="uw-btn-ghost">Cancel</button>
              <button onClick={createEngineer} disabled={creating} className="uw-btn-primary">
                {creating
                  ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Creating…</>
                  : "Create Engineer"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── OVERVIEW ── */}
        {activeSection === "overview" && (
          <div>
            <SectionHeader label="System Overview" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard label="Total Issues"   value={stats?.total}      accent="var(--text)"     delay={0}    icon={Icon.clipboard} sub="All time" />
              <StatCard label="In Progress"    value={stats?.inProgress}  accent="var(--accent)"   delay={0.06} icon={Icon.zap}       sub="Active now" />
              <StatCard label="Resolved"       value={stats?.resolved}    accent="var(--green)"    delay={0.12} icon={Icon.check}     sub="Completed" />
              <StatCard label="Total Upvotes"  value={issues.reduce((a,i)=>a+(i.upvotes?.length||0),0)} accent="#a78bfa" delay={0.18} icon={Icon.arrowUp} sub="Community votes" />
            </div>
            <div className="uw-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Issues by Category</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>Distribution across infrastructure types</div>
              {chartData && <div style={{ height: 260 }}><Bar data={chartData} options={chartOptions} /></div>}
            </div>
          </div>
        )}

        {/* ── ISSUES ── */}
        {activeSection === "issues" && (
          <div>
            <SectionHeader label="Issue Management">
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>{filteredIssues.length} result{filteredIssues.length !== 1 ? "s" : ""}</span>
            </SectionHeader>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              {wards.length > 0 && (
                <select className="uw-select" style={{ width: 190 }} value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
                  <option value="">All Wards</option>
                  {wards.map((w) => <option key={w._id} value={w._id}>Ward {w.number} — {w.name}</option>)}
                </select>
              )}
              <div style={{ display: "flex", gap: 4 }}>
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={`filter-pill${categoryFilter === c ? " active" : ""}`}>{c}</button>
                ))}
              </div>
              <select className="uw-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                {Object.keys(STATUS).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
              <select className="uw-select" style={{ width: 170 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="priority">Sort: Priority</option>
                <option value="upvotes">Sort: Most Upvoted</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
              {filteredIssues.map((issue, idx) => {
                const cfg = STATUS[issue.status] || STATUS.REPORTED;
                return (
                  <div key={issue._id} className="uw-card" style={{ padding: 20, animation: `fadeUp 0.3s ease ${idx * 0.04}s both` }}>
                    {issue.photos?.length > 0 && (
                      <div style={{ height: 120, overflow: "hidden", borderRadius: 6, marginBottom: 14 }}>
                        <img src={issue.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} onClick={() => window.open(issue.photos[0])} />
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{issue.title}</div>
                      <span className="uw-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-2)", marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {issue.priorityScore}
                      </span>
                      <span>·</span>
                      <span>{issue.category}</span>
                      {issue.upvotes?.length > 0 && <><span>·</span><span style={{ color: "#a78bfa" }}>▲ {issue.upvotes.length}</span></>}
                    </div>
                    {issue.assignedEngineer ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--green-lo)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
                        <div>
                          <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Assigned to</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>{issue.assignedEngineer.name || issue.assignedEngineer.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <select className="uw-select" defaultValue="" onChange={(e) => manualAssign(issue._id, e.target.value)}>
                          <option value="" disabled>— Assign engineer —</option>
                          {engineers.map((eng) => <option key={eng._id} value={eng._id}>{eng.name || eng.email}</option>)}
                        </select>
                        <button onClick={() => autoAssign(issue._id)} className="uw-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                          Auto-assign
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENGINEERS ── */}
        {activeSection === "engineers" && (
          <div>
            <SectionHeader label="Engineer Workload" />
            <div className="uw-card" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Engineer","Active Issues","Workload","Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workload.length === 0 && <tr><td colSpan={4} style={{ padding: 24, color: "var(--text-3)", fontSize: 13, textAlign: "center" }}>No workload data</td></tr>}
                  {workload.map((w, i) => {
                    const count = w.activeCount || w.count || w.total || 0;
                    const barColor = count > 5 ? "var(--red)" : count > 3 ? "var(--amber)" : "var(--green)";
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>{w.email || w.engineer?.email || "Unknown"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: barColor, letterSpacing: "-0.02em" }}>{count}</span>
                        </td>
                        <td style={{ padding: "14px 16px", width: 160 }}>
                          <div style={{ height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(count*10,100)}%`, background: barColor, borderRadius: 3, transition: "width 0.6s ease" }} />
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span className="uw-badge" style={{ background: "var(--green-lo)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>Active</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WARDS ── */}
        {activeSection === "wards" && (
          <div>
            <SectionHeader label={`Ward Management · ${wards.length} wards`} />
            <div className="uw-card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>New Ward</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 10, alignItems: "flex-end" }}>
                <div><label className="uw-label">Ward No.</label><input type="number" placeholder="42" className="uw-input" value={wardForm.number} onChange={(e) => setWardForm({ ...wardForm, number: e.target.value })} /></div>
                <div><label className="uw-label">Name</label><input type="text" placeholder="Karol Bagh" className="uw-input" value={wardForm.name} onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })} /></div>
                <div><label className="uw-label">Area / Zone</label><input type="text" placeholder="Central Delhi" className="uw-input" value={wardForm.area} onChange={(e) => setWardForm({ ...wardForm, area: e.target.value })} /></div>
                <button onClick={createWard} className="uw-btn-primary" style={{ height: 38 }}>Add Ward</button>
              </div>
            </div>
            <div className="uw-card" style={{ overflow: "hidden" }}>
              {wards.length === 0
                ? <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No wards yet.</div>
                : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["No.","Name","Area","Issues",""].map((h) => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {wards.map((ward) => {
                        const cnt = issues.filter((i) => i.wardId?.toString() === ward._id.toString()).length;
                        return (
                          <tr key={ward._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "14px 16px", fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{ward.number}</td>
                            <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>{ward.name}</td>
                            <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-2)" }}>{ward.area || "—"}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span className="uw-badge" style={{ background: cnt > 0 ? "var(--amber-lo)" : "var(--bg-hover)", color: cnt > 0 ? "var(--amber)" : "var(--text-3)", border: `1px solid ${cnt > 0 ? "rgba(245,158,11,0.25)" : "var(--border)"}` }}>
                                {cnt} issue{cnt !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <button onClick={() => deleteWard(ward._id)} className="uw-btn-danger" style={{ height: 30, padding: "0 10px", fontSize: 12 }}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}

        {/* ── MAP ── */}
        {activeSection === "map" && (
          <div>
            <SectionHeader label="Geographic Overview" />
            <div className="uw-card" style={{ overflow: "hidden", height: 520, position: "relative" }}>
              <IssueMap issues={filteredIssues} />
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeSection === "history" && (
          <div>
            <SectionHeader label="Assignment Log" />
            <div className="uw-card" style={{ overflow: "hidden", maxHeight: 620, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Issue","Engineer","Assigned At"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 500 }}>{h.issueId?.title}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-2)" }}>{h.engineerId?.email}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
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
