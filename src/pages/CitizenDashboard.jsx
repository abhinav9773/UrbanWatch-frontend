import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../api/usePushNotifications";
import toast from "react-hot-toast";
import IssueMap from "../components/IssueMap";
import Navbar from "../components/Navbar";

const STATUS = {
  REPORTED:    { label: "Reported",    color: "#71717a", bg: "rgba(113,113,122,0.12)" },
  VERIFIED:    { label: "Verified",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  RESOLVED:    { label: "Resolved",    color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};

const SEVERITY_LABELS = { 5:"Critical", 4:"High", 3:"Medium", 2:"Low", 1:"Very Low" };
const SEVERITY_COLORS = { 5:"var(--red)", 4:"#f97316", 3:"var(--amber)", 2:"var(--accent)", 1:"var(--green)" };

function getRemainingTime(dueAt) {
  if (!dueAt) return { text: "No SLA", overdue: false };
  const diff = new Date(dueAt) - new Date();
  if (diff <= 0) return { text: "Overdue", overdue: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { text: `${h}h ${m}m`, overdue: false };
}

/* ─── SVG stat icons ─── */
const StatIcons = {
  reports: (c) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  progress: (c) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  resolved: (c) => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export default function CitizenDashboard() {
  const [issues, setIssues]           = useState([]);
  const [wards, setWards]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [photoFiles, setPhotoFiles]   = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [activeTab, setActiveTab]     = useState("reports");
  const fileRef = useRef(null);
  const { user } = useAuth();

  usePushNotifications(user);

  const [form, setForm] = useState({
    title: "", description: "", category: "ROAD",
    severity: 3, lat: "", lng: "", wardId: "",
  });

  useEffect(() => { fetchMyIssues(); fetchWards(); }, []);

  const fetchMyIssues = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/issues/me", { headers: { Authorization: `Bearer ${token}` } });
      setIssues(res.data);
    } catch { toast.error("Failed to load issues"); }
    finally { setLoading(false); }
  };

  const fetchWards = async () => {
    try { const res = await api.get("/wards"); setWards(res.data); } catch {}
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error("GPS not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((p) => ({ ...p, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() })); toast.success("Location detected"); },
      () => toast.error("Location access denied"),
    );
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photoFiles.length > 5) { toast.error("Max 5 photos"); return; }
    setPhotoFiles((p) => [...p, ...files]);
    setPhotoPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx) => {
    setPhotoFiles((p) => p.filter((_,i) => i !== idx));
    setPhotoPreviews((p) => p.filter((_,i) => i !== idx));
  };

  const submitIssue = async () => {
    if (!form.title || !form.lat || !form.lng) { toast.error("Title and location required"); return; }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("severity", form.severity);
      fd.append("location", JSON.stringify({ type: "Point", coordinates: [Number(form.lng), Number(form.lat)] }));
      fd.append("reportedBy", user._id);
      if (form.wardId) fd.append("wardId", form.wardId);
      photoFiles.forEach((f) => fd.append("photos", f));
      await api.post("/issues", fd, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
      toast.success("Issue reported");
      setForm({ title: "", description: "", category: "ROAD", severity: 3, lat: "", lng: "", wardId: "" });
      setPhotoFiles([]); setPhotoPreviews([]);
      setShowForm(false); fetchMyIssues();
    } catch { toast.error("Submit failed"); }
    finally { setSubmitting(false); }
  };

  const handleUpvote = async (issueId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(`/issues/${issueId}/upvote`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIssues((prev) => prev.map((i) =>
        i._id === issueId
          ? { ...i, upvotes: res.data.upvoted ? [...(i.upvotes||[]), user._id] : (i.upvotes||[]).filter((u) => u !== user._id) }
          : i
      ));
    } catch { toast.error("Upvote failed"); }
  };

  const openIssueDetail = async (issue) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/issues/${issue._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedIssue(res.data);
    } catch { setSelectedIssue(issue); }
  };

  const resolved   = issues.filter((i) => i.status === "RESOLVED").length;
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;

  const statCards = [
    { label: "Total Reports", value: issues.length,  accent: "var(--text)",     icon: StatIcons.reports  },
    { label: "In Progress",   value: inProgress,     accent: "var(--accent)",   icon: StatIcons.progress },
    { label: "Resolved",      value: resolved,        accent: "var(--green)",    icon: StatIcons.resolved },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Geist', sans-serif", color: "var(--text)" }}>
      <Navbar
        role="CITIZEN"
        actions={
          <button onClick={() => setShowForm(true)} className="uw-btn-primary">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Report Issue
          </button>
        }
      />

      {/* ── Report Modal — z-index 9999 so it always sits above the map ── */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 520, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Report a Civic Issue</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Help your community by flagging infrastructure problems</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 22, padding: 4 }}>×</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto" }}>
              <div>
                <label className="uw-label">Title <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="text" placeholder="e.g. Large pothole on main road" className="uw-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              </div>

              <div>
                <label className="uw-label">Description</label>
                <textarea placeholder="Provide more details about the issue…" className="uw-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="uw-label">Category</label>
                  <select className="uw-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {["ROAD","WATER","LIGHTING","SANITATION","OTHER"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="uw-label">Severity</label>
                  <select className="uw-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {[5,4,3,2,1].map((v) => <option key={v} value={v}>{SEVERITY_LABELS[v]}</option>)}
                  </select>
                </div>
              </div>

              {/* Severity bar */}
              <div style={{ display: "flex", gap: 4 }}>
                {[1,2,3,4,5].map((v) => (
                  <div key={v} style={{ flex: 1, height: 4, borderRadius: 2, background: v <= form.severity ? SEVERITY_COLORS[form.severity] : "var(--border)", transition: "background 0.2s" }} />
                ))}
              </div>

              {wards.length > 0 && (
                <div>
                  <label className="uw-label">Ward</label>
                  <select className="uw-select" value={form.wardId} onChange={(e) => setForm({ ...form, wardId: e.target.value })}>
                    <option value="">— Select your ward —</option>
                    {wards.map((w) => <option key={w._id} value={w._id}>Ward {w.number} — {w.name}</option>)}
                  </select>
                </div>
              )}

              {/* Photos */}
              <div>
                <label className="uw-label">
                  Photos
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 400, marginLeft: 6 }}>max 5</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "1px dashed var(--border-hi)", borderRadius: 8,
                    padding: "20px 16px", textAlign: "center", cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-lo)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-hi)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ color: "var(--text-3)", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>Click to add photos</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>JPG, PNG, WEBP · Max 5MB each</div>
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
                {photoPreviews.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {photoPreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={src} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                        <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, background: "var(--red)", border: "2px solid var(--bg)", borderRadius: "50%", color: "white", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="uw-label">Location <span style={{ color: "var(--red)" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input readOnly value={form.lat} placeholder="Latitude" className="uw-input" style={{ color: form.lat ? "var(--green)" : undefined }} />
                  <input readOnly value={form.lng} placeholder="Longitude" className="uw-input" style={{ color: form.lng ? "var(--green)" : undefined }} />
                </div>
                {form.lat && form.lng && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--green)", marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
                    Location captured successfully
                  </div>
                )}
                <button onClick={detectLocation} className="uw-btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  Detect My Location
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} className="uw-btn-ghost">Cancel</button>
              <button onClick={submitIssue} disabled={submitting} className="uw-btn-primary">
                {submitting
                  ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Submitting…</>
                  : "Submit Report"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issue Detail Modal ── */}
      {selectedIssue && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width: 540, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Issue Detail</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{selectedIssue.title}</div>
              </div>
              <button onClick={() => setSelectedIssue(null)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 22, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}>
              {selectedIssue.photos?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Photos</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedIssue.photos.map((url, i) => (
                      <img key={i} src={url} alt="" style={{ width: 130, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer" }} onClick={() => window.open(url)} />
                    ))}
                  </div>
                </div>
              )}
              {selectedIssue.description && (
                <div style={{ marginBottom: 20, padding: "12px 14px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "var(--text-2)" }}>
                  {selectedIssue.description}
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Progress Updates</div>
                {(!selectedIssue.updates || selectedIssue.updates.length === 0)
                  ? <div style={{ color: "var(--text-3)", fontSize: 13 }}>No updates posted yet</div>
                  : selectedIssue.updates.map((upd, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < selectedIssue.updates.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", marginTop: 4 }} />
                        {i < selectedIssue.updates.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--border)", minHeight: 16, margin: "4px 0" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{upd.message}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {upd.postedByName || "Engineer"} · {new Date(upd.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {statCards.map((s, i) => (
            <div key={s.label} className="uw-card" style={{ padding: 20, animation: `fadeUp 0.3s ease ${i * 0.07}s both` }}>
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

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "var(--bg-subtle)", padding: 4, borderRadius: 8, width: "fit-content", border: "1px solid var(--border)" }}>
          {[{ id: "reports", label: "My Reports" }, { id: "map", label: "Map View" }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "6px 18px", borderRadius: 6, border: "none", fontFamily: "'Geist'", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              background: activeTab === t.id ? "var(--bg-card)" : "transparent",
              color: activeTab === t.id ? "var(--text)" : "var(--text-2)",
              boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Map view */}
        {activeTab === "map" && (
          <div className="uw-card" style={{ overflow: "hidden", height: 480, animation: "fadeUp 0.3s ease" }}>
            <IssueMap issues={issues} />
          </div>
        )}

        {/* Reports list */}
        {activeTab === "reports" && (
          <>
            {loading && (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ width: 28, height: 28, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading reports…</div>
              </div>
            )}

            {!loading && issues.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--text-3)" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No issues reported yet</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>Help improve your city by flagging infrastructure problems.</div>
                <button onClick={() => setShowForm(true)} className="uw-btn-primary">Report Your First Issue</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {issues.map((issue, i) => {
                const cfg = STATUS[issue.status] || STATUS.REPORTED;
                const sla = getRemainingTime(issue.dueAt);
                const upvoteCnt = issue.upvotes?.length || 0;
                const hasUpvoted = issue.upvotes?.some((u) => u === user._id || u?._id === user._id);
                return (
                  <div key={issue._id} className="uw-card" style={{ overflow: "hidden", cursor: "pointer", animation: `fadeUp 0.3s ease ${i * 0.04}s both` }} onClick={() => openIssueDetail(issue)}>
                    {issue.photos?.length > 0 && (
                      <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                        <img src={issue.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {issue.photos.length > 1 && <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 4, fontSize: 11, color: "#fff" }}>+{issue.photos.length - 1}</div>}
                        <span className="uw-badge" style={{ position: "absolute", top: 8, left: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, backdropFilter: "blur(4px)" }}>{cfg.label}</span>
                      </div>
                    )}

                    <div style={{ padding: 16 }}>
                      {!issue.photos?.length && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{issue.title}</div>
                          <span className="uw-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, flexShrink: 0, marginLeft: 8 }}>{cfg.label}</span>
                        </div>
                      )}
                      {issue.photos?.length > 0 && (
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>{issue.title}</div>
                      )}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        <span style={{ fontSize: 11, color: "var(--text-3)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>{issue.category}</span>
                        <span style={{
                          fontSize: 11, background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)",
                          color: sla.overdue ? "var(--red)" : "var(--text-3)",
                        }}>
                          {sla.overdue ? "Overdue" : `SLA ${sla.text}`}
                        </span>
                        {issue.updates?.length > 0 && (
                          <span style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-lo)", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(59,130,246,0.2)" }}>
                            {issue.updates.length} update{issue.updates.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleUpvote(issue._id, e)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "5px 10px", borderRadius: 6,
                          background: hasUpvoted ? "var(--accent-lo)" : "var(--bg-hover)",
                          border: `1px solid ${hasUpvoted ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                          color: hasUpvoted ? "var(--accent)" : "var(--text-2)",
                          fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Geist'",
                          transition: "all 0.15s",
                        }}
                      >
                        <svg width="12" height="12" fill={hasUpvoted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 19V6M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {upvoteCnt} upvote{upvoteCnt !== 1 ? "s" : ""}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
