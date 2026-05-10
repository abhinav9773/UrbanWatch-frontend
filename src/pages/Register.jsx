import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

function SunIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Register() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [coords, setCoords]     = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [theme, setTheme]       = useState("dark");
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("uw-theme");
    if (saved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setTheme("light");
    }
    if (!navigator.geolocation) return;
    setLocStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocStatus("done"); },
      () => setLocStatus("denied"),
    );
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("uw-theme", next);
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["transparent", "#ef4444", "#f59e0b", "#22c55e"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill all fields"); return; }
    try {
      setLoading(true);
      await api.post("/auth/register", {
        name, email, password, role: "CITIZEN",
        lat: coords?.lat, lng: coords?.lng,
      });
      toast.success("Account created — sign in to continue");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      fontFamily: "'Geist', sans-serif",
      color: "var(--text)",
      transition: "background 0.22s",
    }}>
      {/* ── Left — form ── */}
      <div style={{
        width: 500,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 52px",
        position: "relative",
        animation: "fadeUp 0.3s ease",
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="uw-theme-toggle"
          style={{ position: "absolute", top: 28, right: 28 }}
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{
            width: 42, height: 42, background: "var(--accent)", borderRadius: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 9V21H9V15H15V21H20V9L12 3Z" fill="white" fillOpacity="0.95"/>
              <circle cx="12" cy="11" r="2.5" fill="rgba(0,0,0,0.25)"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>UrbanWatch</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px" }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>
            Already registered?{" "}
            <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="uw-label">Full name</label>
            <input type="text" placeholder="Jane Smith" className="uw-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>

          <div>
            <label className="uw-label">Email address</label>
            <input type="email" placeholder="jane@example.com" className="uw-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="uw-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"} placeholder="Minimum 8 characters" className="uw-input"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                display: "flex", alignItems: "center", padding: 0,
              }}>
                {showPass
                  ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : "var(--border)", transition: "background 0.25s" }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColors[strength] }}>{strengthLabels[strength]}</div>
              </div>
            )}
          </div>

          {/* Location status */}
          {locStatus === "detecting" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "var(--accent-lo)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 13, color: "var(--accent)" }}>
              <span style={{ width: 13, height: 13, border: "2px solid rgba(59,130,246,0.3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
              Detecting location for ward auto-assignment…
            </div>
          )}
          {locStatus === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "var(--green-lo)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 13, color: "var(--green)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Location captured — ward will be assigned automatically
            </div>
          )}

          <button type="submit" disabled={loading} className="uw-btn-primary" style={{
            width: "100%", height: 42, justifyContent: "center", fontSize: 14, marginTop: 4, fontWeight: 600,
          }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Creating account…</>
              : "Create account"
            }
          </button>
        </form>

        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 20, lineHeight: 1.7 }}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* ── Right — decorative ── */}
      <div className="reg-right-panel" style={{
        flex: 1,
        background: "var(--bg-subtle)",
        borderLeft: "1px solid var(--border)",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "center", padding: 64,
      }}>
        {/* Grid */}
        <div
  style={{
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/Backdrop.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    opacity: 0.4,
  }}
/>  
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(34,197,94,0.05) 0%, transparent 65%)" }} />

        <div style={{ position: "relative", maxWidth: 400 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 24,
          }}>
            What citizens get
          </div>
          {[
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
              title: "Report civic issues",
              desc: "Flag potholes, broken lighting, water leaks and more directly from your device.",
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
              title: "Live map tracking",
              desc: "Watch your reports move from filed to in-progress to resolved on a real-time map.",
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
              title: "Instant notifications",
              desc: "Get notified the moment your issue is assigned to an engineer or marked resolved.",
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M12 19V6M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              title: "Community upvotes",
              desc: "Support your neighbors' reports to boost their AI priority score.",
            },
          ].map((f) => (
            <div key={f.title} style={{ display: "flex", gap: 16, marginBottom: 28 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent)",
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) { .reg-right-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
