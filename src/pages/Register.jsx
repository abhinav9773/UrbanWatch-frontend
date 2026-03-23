import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    // Auto-detect location on mount silently
    if (navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setDetectingLocation(false);
        },
        () => setDetectingLocation(false),
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Fill all fields ⚠️");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/register", {
        name,
        email,
        password,
        role: "CITIZEN",
        lat: coords?.lat,
        lng: coords?.lng,
      });
      toast.success("Account created ✅");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthColor = ["transparent", "#ff4466", "#ffaa00", "#00ff88"][
    strength
  ];
  const strengthLabel = ["", "Weak", "Moderate", "Strong"][strength];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050a0f",
        display: "flex",
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.15)} 50%{box-shadow:0 0 40px rgba(0,255,136,0.35)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .uw-input { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(0,255,136,0.2); color:#e0ffe8; padding:12px 0; font-family:'DM Mono',monospace; font-size:14px; outline:none; transition:border-color 0.3s; letter-spacing:0.05em; }
        .uw-input:focus { border-bottom-color:#00ff88; }
        .uw-input::placeholder { color:rgba(0,255,136,0.25); font-size:12px; letter-spacing:0.1em; text-transform:uppercase; }
        .uw-btn { position:relative; width:100%; background:#00ff88; color:#050a0f; border:none; padding:14px; font-family:'Syne',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:all 0.3s; clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%); }
        .uw-btn:hover:not(:disabled) { background:#00ffaa; transform:translateY(-2px); box-shadow:0 8px 30px rgba(0,255,136,0.4); }
        .uw-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(0,255,136,0.08),transparent); animation:scanline 8s linear infinite; pointer-events:none; }
        .field-wrap { position:relative; animation:slideUp 0.5s ease forwards; opacity:0; }
        .field-wrap:nth-child(1){animation-delay:0.1s}
        .field-wrap:nth-child(2){animation-delay:0.2s}
        .field-wrap:nth-child(3){animation-delay:0.3s}
        .field-wrap:nth-child(4){animation-delay:0.4s}
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
          animation: mounted ? "slideUp 0.6s ease forwards" : "none",
          opacity: 0,
        }}
      >
        <div className="scanline" />

        {/* Logo */}
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "1px solid #00ff88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  background: "#00ff88",
                  animation: "glowPulse 2s ease infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "20px",
                fontWeight: 800,
                color: "#e0ffe8",
                letterSpacing: "0.05em",
              }}
            >
              URBAN<span style={{ color: "#00ff88" }}>WATCH</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "44px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "1px",
                background: "rgba(0,255,136,0.4)",
              }}
            />
            <span
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Citizen Registration
            </span>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "44px" }}>
          <div
            style={{
              color: "rgba(0,255,136,0.5)",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            // New User
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "42px",
              fontWeight: 800,
              color: "#e0ffe8",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Join the
            <br />
            <span style={{ color: "#00ff88" }}>Grid.</span>
          </h1>
        </div>

        {/* Location detection indicator */}
        {detectingLocation && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              padding: "10px 14px",
              background: "rgba(0,153,255,0.06)",
              border: "1px solid rgba(0,153,255,0.15)",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                border: "1px solid rgba(0,153,255,0.5)",
                borderTop: "1px solid #0099ff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "11px", color: "rgba(0,153,255,0.8)" }}>
              Detecting your location for ward assignment...
            </span>
          </div>
        )}

        {coords && !detectingLocation && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
              padding: "10px 14px",
              background: "rgba(0,255,136,0.05)",
              border: "1px solid rgba(0,255,136,0.15)",
            }}
          >
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
            <span style={{ fontSize: "11px", color: "rgba(0,255,136,0.8)" }}>
              Location detected — ward will be auto-assigned
            </span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "28px" }}
        >
          <div className="field-wrap">
            <div
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Full Name
            </div>
            <input
              type="text"
              placeholder="John Doe"
              className="uw-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
            />
            {focused === "name" && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "12px",
                  width: "6px",
                  height: "12px",
                  background: "#00ff88",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>

          <div className="field-wrap">
            <div
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Email Address
            </div>
            <input
              type="email"
              placeholder="user@example.com"
              className="uw-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
            {focused === "email" && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "12px",
                  width: "6px",
                  height: "12px",
                  background: "#00ff88",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>

          <div className="field-wrap">
            <div
              style={{
                color: "rgba(0,255,136,0.4)",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Password
            </div>
            <input
              type="password"
              placeholder="Min 8 characters"
              className="uw-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
            />
            {focused === "password" && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: password ? "32px" : "12px",
                  width: "6px",
                  height: "12px",
                  background: "#00ff88",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
            {password && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: "2px",
                        background:
                          i <= strength
                            ? strengthColor
                            : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    color: strengthColor,
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    marginTop: "4px",
                  }}
                >
                  {strengthLabel}
                </div>
              </div>
            )}
          </div>

          <div className="field-wrap" style={{ marginTop: "8px" }}>
            <button type="submit" disabled={loading} className="uw-btn">
              {loading ? "Creating account..." : "Initialize Account"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "36px",
            borderTop: "1px solid rgba(0,255,136,0.08)",
            paddingTop: "24px",
          }}
        >
          <span style={{ color: "rgba(0,255,136,0.35)", fontSize: "12px" }}>
            Already registered?{" "}
            <Link
              to="/login"
              style={{
                color: "#00ff88",
                textDecoration: "none",
                borderBottom: "1px solid rgba(0,255,136,0.3)",
              }}
            >
              Sign in
            </Link>
          </span>
        </div>

        {/* Corners */}
        <div style={{ position: "absolute", top: "24px", left: "24px" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "12px",
              height: "1px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1px",
              height: "12px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
        </div>
        <div style={{ position: "absolute", bottom: "24px", right: "24px" }}>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "12px",
              height: "1px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "1px",
              height: "12px",
              background: "rgba(0,255,136,0.3)",
            }}
          />
        </div>

        {/* Status */}
        <div
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00ff88",
              animation: "glowPulse 2s ease infinite",
            }}
          />
          <span
            style={{
              color: "rgba(0,255,136,0.4)",
              fontSize: "10px",
              letterSpacing: "0.15em",
            }}
          >
            SYS ONLINE
          </span>
        </div>
      </div>
    </div>
  );
}
