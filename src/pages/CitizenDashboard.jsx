import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { usePushNotifications } from "../api/usePushNotifications";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
  * { box-sizing: border-box; }
  @keyframes glowPulse { 0%,100%{box-shadow:0 0 12px rgba(0,255,136,0.2)} 50%{box-shadow:0 0 28px rgba(0,255,136,0.5)} }
  @keyframes scanline { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .uw-card { background:rgba(0,255,136,0.02); border:1px solid rgba(0,255,136,0.1); position:relative; transition:border-color 0.3s,background 0.3s,transform 0.3s; animation:fadeUp 0.5s ease forwards; opacity:0; }
  .uw-card:hover { border-color:rgba(0,255,136,0.3); background:rgba(0,255,136,0.04); transform:translateY(-2px); }
  .uw-card::before { content:''; position:absolute; top:0; left:0; width:20px; height:1px; background:#00ff88; }
  .uw-card::after { content:''; position:absolute; top:0; left:0; width:1px; height:20px; background:#00ff88; }
  .uw-card-br { position:absolute; bottom:0; right:0; width:20px; height:1px; background:rgba(0,255,136,0.3); }
  .uw-card-br::after { content:''; position:absolute; right:0; bottom:0; width:1px; height:20px; background:rgba(0,255,136,0.3); }
  .uw-btn { background:#00ff88; color:#050a0f; border:none; padding:12px 20px; font-family:'Syne',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); transition:all 0.2s; }
  .uw-btn:hover { background:#00ffaa; transform:translateY(-1px); }
  .uw-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .uw-btn-danger { background:transparent; color:#ff4466; border:1px solid rgba(255,68,102,0.5); padding:12px 20px; font-family:'Syne',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .uw-btn-danger:hover { border-color:#ff4466; background:rgba(255,68,102,0.1); }
  .uw-btn-ghost { background:transparent; color:#00ff88; border:1px solid rgba(0,255,136,0.4); padding:12px 20px; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.08em; cursor:pointer; transition:all 0.2s; }
  .uw-btn-ghost:hover { border-color:#00ff88; background:rgba(0,255,136,0.08); }
  .uw-field-label { font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.18em; color:#00ff88; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
  .uw-field-label span { color:#ff4466; }
  .uw-input { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.35); color:#e0ffe8; padding:12px 14px; font-family:'DM Mono',monospace; font-size:13px; outline:none; transition:all 0.25s; }
  .uw-input:focus { border-color:#00ff88; background:#0f2418; box-shadow:0 0 0 1px rgba(0,255,136,0.2); }
  .uw-input::placeholder { color:rgba(0,255,136,0.25); font-size:12px; }
  .uw-input:read-only { color:#00ff88; background:#091510; cursor:default; }
  .uw-select { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.35); color:#e0ffe8; padding:12px 14px; font-family:'DM Mono',monospace; font-size:13px; outline:none; cursor:pointer; transition:all 0.25s; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300ff88' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
  .uw-select:focus { border-color:#00ff88; box-shadow:0 0 0 1px rgba(0,255,136,0.2); }
  .uw-select option { background:#0d1f14; color:#e0ffe8; }
  .uw-textarea { width:100%; background:#0d1f14; border:1px solid rgba(0,255,136,0.35); color:#e0ffe8; padding:12px 14px; font-family:'DM Mono',monospace; font-size:13px; outline:none; transition:all 0.25s; resize:vertical; min-height:90px; line-height:1.6; }
  .uw-textarea:focus { border-color:#00ff88; background:#0f2418; box-shadow:0 0 0 1px rgba(0,255,136,0.2); }
  .uw-textarea::placeholder { color:rgba(0,255,136,0.25); font-size:12px; }
  .photo-drop { border:1px dashed rgba(0,255,136,0.35); background:#091510; padding:24px; text-align:center; cursor:pointer; transition:all 0.2s; }
  .photo-drop:hover { border-color:#00ff88; background:#0d1f14; }
  .photo-preview { width:88px; height:66px; object-fit:cover; border:1px solid rgba(0,255,136,0.3); }
  .scanline-global { position:fixed; left:0; right:0; top:0; height:3px; background:linear-gradient(90deg,transparent,rgba(0,255,136,0.06),transparent); animation:scanline 12s linear infinite; pointer-events:none; z-index:999; }
  .section-label { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(0,255,136,0.5); margin-bottom:12px; display:flex; align-items:center; gap:12px; }
  .section-label::after { content:''; flex:1; height:1px; background:rgba(0,255,136,0.1); }
  .upvote-btn { background:transparent; border:1px solid rgba(0,255,136,0.2); color:rgba(0,255,136,0.5); padding:6px 12px; font-family:'DM Mono',monospace; font-size:11px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:6px; }
  .upvote-btn:hover { border-color:rgba(0,255,136,0.5); color:#00ff88; }
  .upvote-btn.upvoted { background:rgba(0,255,136,0.1); border-color:#00ff88; color:#00ff88; }
  .timeline-dot { width:8px; height:8px; background:#00ff88; border-radius:50%; flex-shrink:0; margin-top:4px; }
  .timeline-line { width:1px; background:rgba(0,255,136,0.15); flex:1; min-height:20px; margin-left:3px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(2,6,10,0.92); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(6px); }
  .modal-box { animation:modalIn 0.3s ease forwards; }
  .loc-detected { color:#00ff88; font-size:11px; letter-spacing:0.08em; display:flex; align-items:center; gap:6px; margin-top:6px; }
`;

const STATUS_CONFIG = {
  REPORTED: { color: "#888", bg: "rgba(136,136,136,0.1)" },
  VERIFIED: { color: "#ffaa00", bg: "rgba(255,170,0,0.1)" },
  IN_PROGRESS: { color: "#0099ff", bg: "rgba(0,153,255,0.1)" },
  RESOLVED: { color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
};

const SEVERITY_LABELS = {
  5: "Critical",
  4: "High",
  3: "Medium",
  2: "Low",
  1: "Very Low",
};

export default function CitizenDashboard() {
  const [issues, setIssues] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "ROAD",
    severity: 3,
    lat: "",
    lng: "",
    wardId: "",
  });

  const { user, logout } = useAuth();
  usePushNotifications(user);

  useEffect(() => {
    fetchMyIssues();
    fetchWards();
  }, []);

  useEffect(() => {
    if (!mapRef.current || issues.length === 0) return;
    const bounds = issues
      .filter((i) => i.location?.coordinates)
      .map((i) => {
        const [lng, lat] = i.location.coordinates;
        return [lat, lng];
      });
    if (bounds.length > 0)
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }, [issues]);

  const fetchMyIssues = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/issues/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(res.data);
    } catch {
      toast.error("Failed to load issues ❌");
    } finally {
      setLoading(false);
    }
  };

  const fetchWards = async () => {
    try {
      const res = await api.get("/wards");
      setWards(res.data);
    } catch {}
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported ❌");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }));
        toast.success("Location detected 📍");
      },
      () => toast.error("Location denied ❌"),
    );
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photoFiles.length > 5) {
      toast.error("Max 5 photos");
      return;
    }
    setPhotoFiles((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removePhoto = (idx) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitIssue = async () => {
    try {
      if (!form.title || !form.lat || !form.lng) {
        toast.error("Fill required fields ⚠️");
        return;
      }
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("severity", form.severity);
      formData.append(
        "location",
        JSON.stringify({
          type: "Point",
          coordinates: [Number(form.lng), Number(form.lat)],
        }),
      );
      formData.append("reportedBy", user._id);
      if (form.wardId) formData.append("wardId", form.wardId);
      photoFiles.forEach((f) => formData.append("photos", f));
      await api.post("/issues", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Issue reported 🚀");
      setForm({
        title: "",
        description: "",
        category: "ROAD",
        severity: 3,
        lat: "",
        lng: "",
        wardId: "",
      });
      setPhotoFiles([]);
      setPhotoPreviews([]);
      setShowForm(false);
      fetchMyIssues();
    } catch {
      toast.error("Submit failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (issueId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/issues/${issueId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIssues((prev) =>
        prev.map((i) =>
          i._id === issueId
            ? {
                ...i,
                upvotes: res.data.upvoted
                  ? [...(i.upvotes || []), user._id]
                  : (i.upvotes || []).filter((u) => u !== user._id),
              }
            : i,
        ),
      );
    } catch {
      toast.error("Upvote failed ❌");
    }
  };

  const openIssueDetail = async (issue) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/issues/${issue._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedIssue(res.data);
    } catch {
      setSelectedIssue(issue);
    }
  };

  const getRemainingTime = (dueAt) => {
    if (!dueAt) return "N/A";
    const diff = new Date(dueAt) - new Date();
    if (diff <= 0) return "⛔ Overdue";
    const h = Math.floor(diff / 3600000),
      m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const resolved = issues.filter((i) => i.status === "RESOLVED").length;
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        fontFamily: "'DM Mono', monospace",
        color: "#e0ffe8",
      }}
    >
      <style>{STYLES}</style>
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
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                border: "1px solid rgba(0,255,136,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,255,136,0.06)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "15px",
                  color: "#00ff88",
                }}
              >
                {user?.name?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                }}
              >
                URBAN<span style={{ color: "#00ff88" }}>WATCH</span>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: "rgba(0,255,136,0.4)",
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setShowForm(true)} className="uw-btn">
              + Report Issue
            </button>
            <button onClick={logout} className="uw-btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* REPORT MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-box"
            style={{
              width: "520px",
              maxHeight: "92vh",
              overflowY: "auto",
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
                width: "28px",
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
                height: "28px",
                background: "#00ff88",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "28px",
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
                height: "28px",
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
                  }}
                >
                  // New Report
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
                    Report Issue
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
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
                  gap: "22px",
                }}
              >
                {/* Title */}
                <div>
                  <div className="uw-field-label">
                    Title <span>*</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Large pothole on main road"
                    className="uw-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="uw-field-label">Description</div>
                  <textarea
                    placeholder="Provide more details..."
                    className="uw-textarea"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Category + Severity */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div className="uw-field-label">Category</div>
                    <select
                      className="uw-select"
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    >
                      {["ROAD", "WATER", "LIGHTING", "SANITATION", "OTHER"].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <div className="uw-field-label">Severity</div>
                    <select
                      className="uw-select"
                      value={form.severity}
                      onChange={(e) =>
                        setForm({ ...form, severity: e.target.value })
                      }
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>
                          {SEVERITY_LABELS[v]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Severity bar */}
                <div
                  style={{ display: "flex", gap: "4px", marginTop: "-14px" }}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <div
                      key={v}
                      style={{
                        flex: 1,
                        height: "3px",
                        background:
                          v <= form.severity
                            ? form.severity >= 4
                              ? "#ff4466"
                              : form.severity === 3
                                ? "#ffaa00"
                                : "#00ff88"
                            : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>

                {/* Ward — manual select */}
                {wards.length > 0 && (
                  <div>
                    <div className="uw-field-label">Ward</div>
                    <select
                      className="uw-select"
                      value={form.wardId}
                      onChange={(e) =>
                        setForm({ ...form, wardId: e.target.value })
                      }
                    >
                      <option value="">— Select your ward —</option>
                      {wards.map((w) => (
                        <option key={w._id} value={w._id}>
                          Ward {w.number} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Photos */}
                <div>
                  <div className="uw-field-label">
                    Photos{" "}
                    <span
                      style={{
                        color: "rgba(0,255,136,0.4)",
                        fontSize: "10px",
                        fontWeight: 400,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      (max 5)
                    </span>
                  </div>
                  <div
                    className="photo-drop"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      📷
                    </div>
                    <div
                      style={{
                        color: "#00ff88",
                        fontSize: "13px",
                        marginBottom: "4px",
                      }}
                    >
                      Click to add photos
                    </div>
                    <div
                      style={{
                        color: "rgba(0,255,136,0.35)",
                        fontSize: "11px",
                      }}
                    >
                      JPG, PNG, WEBP · Max 5MB each
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoSelect}
                  />
                  {photoPreviews.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginTop: "10px",
                      }}
                    >
                      {photoPreviews.map((src, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={src} alt="" className="photo-preview" />
                          <button
                            onClick={() => removePhoto(i)}
                            style={{
                              position: "absolute",
                              top: "-6px",
                              right: "-6px",
                              width: "18px",
                              height: "18px",
                              background: "#ff4466",
                              border: "none",
                              color: "white",
                              fontSize: "11px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              fontWeight: 700,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <div className="uw-field-label">
                    Location <span>*</span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <input
                      readOnly
                      value={form.lat}
                      placeholder="Latitude"
                      className="uw-input"
                    />
                    <input
                      readOnly
                      value={form.lng}
                      placeholder="Longitude"
                      className="uw-input"
                    />
                  </div>
                  {form.lat && form.lng && (
                    <div className="loc-detected">
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#00ff88",
                          display: "inline-block",
                          animation: "glowPulse 2s ease infinite",
                        }}
                      />
                      Location detected
                    </div>
                  )}
                  <button
                    onClick={detectLocation}
                    className="uw-btn-ghost"
                    style={{ width: "100%", marginTop: "10px" }}
                  >
                    📍 Detect My Location
                  </button>
                </div>
              </div>

              <div
                style={{
                  height: "1px",
                  background: "rgba(0,255,136,0.1)",
                  margin: "28px 0",
                }}
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowForm(false)}
                  className="uw-btn-danger"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitIssue}
                  disabled={submitting}
                  className="uw-btn"
                  style={{
                    flex: 2,
                    clipPath:
                      "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE DETAIL MODAL */}
      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div
            className="modal-box"
            style={{
              width: "560px",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#07120d",
              border: "1px solid rgba(0,255,136,0.25)",
              position: "relative",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "28px",
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
                height: "28px",
                background: "#00ff88",
              }}
            />
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
                    color: "rgba(0,255,136,0.5)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  // Issue Detail
                </div>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "20px",
                    fontWeight: 800,
                    margin: 0,
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
            {selectedIssue.photos?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  className="uw-field-label"
                  style={{ marginBottom: "10px" }}
                >
                  Photos
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedIssue.photos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      style={{
                        width: "130px",
                        height: "96px",
                        objectFit: "cover",
                        border: "1px solid rgba(0,255,136,0.2)",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(url)}
                    />
                  ))}
                </div>
              </div>
            )}
            {selectedIssue.description && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "14px",
                  background: "rgba(0,255,136,0.03)",
                  border: "1px solid rgba(0,255,136,0.1)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "rgba(224,255,232,0.8)",
                }}
              >
                {selectedIssue.description}
              </div>
            )}
            <div>
              <div className="uw-field-label" style={{ marginBottom: "14px" }}>
                Progress Updates
              </div>
              {(!selectedIssue.updates ||
                selectedIssue.updates.length === 0) && (
                <div
                  style={{
                    color: "rgba(0,255,136,0.25)",
                    fontSize: "12px",
                    padding: "12px 0",
                  }}
                >
                  No updates yet
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
                      <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                        {upd.message}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "rgba(0,255,136,0.35)",
                        }}
                      >
                        {upd.postedByName || "Engineer"} ·{" "}
                        {new Date(upd.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 32px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {[
            { label: "Total Reports", value: issues.length, accent: "#e0ffe8" },
            { label: "In Progress", value: inProgress, accent: "#0099ff" },
            { label: "Resolved", value: resolved, accent: "#00ff88" },
          ].map((s, i) => (
            <div
              key={i}
              className="uw-card"
              style={{ padding: "20px", animationDelay: `${i * 0.1}s` }}
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
                  fontSize: "36px",
                  fontWeight: 800,
                  color: s.accent,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="section-label">// Issue Locations</div>
        <div
          className="uw-card"
          style={{
            padding: "4px",
            marginBottom: "32px",
            height: "360px",
            overflow: "hidden",
          }}
        >
          <div className="uw-card-br" />
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {issues.map((issue) => {
              if (!issue.location?.coordinates) return null;
              const [lng, lat] = issue.location.coordinates;
              return (
                <Marker key={issue._id} position={[lat, lng]}>
                  <Popup>
                    <b>{issue.title}</b>
                    <br />
                    {issue.status}
                    <br />
                    SLA: {getRemainingTime(issue.dueAt)}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className="section-label">// My Reports</div>
        {loading && (
          <div
            style={{
              color: "rgba(0,255,136,0.4)",
              fontSize: "12px",
              textAlign: "center",
              padding: "40px",
            }}
          >
            Loading...
          </div>
        )}
        {!loading && issues.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "rgba(0,255,136,0.3)",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              No issues reported yet
            </div>
            <button onClick={() => setShowForm(true)} className="uw-btn">
              Report First Issue
            </button>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {issues.map((issue, i) => {
            const cfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.REPORTED;
            const timeLeft = getRemainingTime(issue.dueAt);
            const isOverdue = timeLeft === "⛔ Overdue";
            const upvoteCount = issue.upvotes?.length || 0;
            const hasUpvoted = issue.upvotes?.some(
              (u) => u === user._id || u?._id === user._id,
            );
            return (
              <div
                key={issue._id}
                className="uw-card"
                style={{
                  padding: "22px",
                  animationDelay: `${i * 0.05}s`,
                  cursor: "pointer",
                }}
                onClick={() => openIssueDetail(issue)}
              >
                <div className="uw-card-br" />
                {issue.photos?.length > 0 && (
                  <div
                    style={{
                      marginBottom: "14px",
                      height: "120px",
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
                      }}
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
                        }}
                      >
                        +{issue.photos.length - 1}
                      </div>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "14px",
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
                    style={{
                      padding: "3px 10px",
                      fontSize: "10px",
                      letterSpacing: "0.08em",
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
                <div
                  style={{
                    borderTop: "1px solid rgba(0,255,136,0.06)",
                    paddingTop: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                    }}
                  >
                    <span style={{ color: "rgba(0,255,136,0.4)" }}>
                      Category
                    </span>
                    <span>{issue.category}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                    }}
                  >
                    <span style={{ color: "rgba(0,255,136,0.4)" }}>SLA</span>
                    <span style={{ color: isOverdue ? "#ff4466" : "#00ff88" }}>
                      {timeLeft}
                    </span>
                  </div>
                  {issue.updates?.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ color: "rgba(0,255,136,0.4)" }}>
                        Updates
                      </span>
                      <span style={{ color: "#0099ff" }}>
                        {issue.updates.length} update
                        {issue.updates.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    className={`upvote-btn${hasUpvoted ? " upvoted" : ""}`}
                    onClick={(e) => handleUpvote(issue._id, e)}
                  >
                    ▲ {upvoteCount} {upvoteCount === 1 ? "upvote" : "upvotes"}
                  </button>
                  <span
                    style={{ fontSize: "10px", color: "rgba(0,255,136,0.3)" }}
                  >
                    tap for details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
