import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

/* ── Sun icon ── */
const SunIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
  </svg>
);

/* ── Moon icon ── */
const MoonIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Bell icon ── */
const BellIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

/* ── Logout icon ── */
const LogoutIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Logo ── */
const Logo = () => (
  <div style={{
    width: 38, height: 38,
    background: "var(--accent)",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3L4 9V21H9V15H15V21H20V9L12 3Z" fill="white" fillOpacity="0.95"/>
      <circle cx="12" cy="11" r="2.5" fill="rgba(0,0,0,0.3)"/>
    </svg>
  </div>
);

/* ── Notification Item ── */
function NotifItem({ n }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid ${!n.isRead ? "var(--accent)" : "transparent"}`,
        background: hovered
          ? "var(--bg-hover)"
          : !n.isRead
          ? "var(--accent-lo)"
          : "transparent",
        transition: "background 0.15s",
        cursor: "default",
      }}
    >
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        {/* Icon dot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 5,
          background: !n.isRead ? "var(--accent)" : "var(--border-hi)",
          boxShadow: !n.isRead ? "0 0 6px var(--accent)" : "none",
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13, lineHeight: 1.5, color: "var(--text)",
            fontWeight: !n.isRead ? 500 : 400,
          }}>
            {n.message}
          </div>
          <div style={{
            fontSize: 11, color: "var(--text-3)", marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {new Date(n.createdAt).toLocaleString(undefined, {
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Navbar({
  role = "CITIZEN",
  tabs = [],
  activeTab,
  onTabChange,
  notifications = [],
  onBellClick,
  showNotifications = false,
  notifRef,
  actions,
}) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  const roleLabel = {
    ADMIN:    "Admin Console",
    ENGINEER: "Field Engineer",
    CITIZEN:  "Citizen Portal",
  }[role] || "";

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("uw-theme", next);
  };

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("uw-theme");
    if (saved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setTheme("light");
    }
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 500,
      background: "var(--nav-bg)",
      backdropFilter: "blur(18px)",
      borderBottom: "1px solid var(--border)",
      fontFamily: "'Geist', sans-serif",
      transition: "background 0.22s",
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "0 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        gap: 16,
      }}>

        {/* ── Logo + wordmark ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Logo />
          <div style={{ lineHeight: 1 }}>
            <div style={{
              fontSize: 17, fontWeight: 800,
              letterSpacing: "-0.03em", color: "var(--text)",
              lineHeight: 1.1,
            }}>
              UrbanWatch
            </div>
            <div style={{
              fontSize: 10.5, color: "var(--text-3)",
              marginTop: 3, letterSpacing: "0.04em",
              textTransform: "uppercase", fontWeight: 500,
            }}>
              {roleLabel}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        {tabs.length > 0 && (
          <div style={{ display: "flex", gap: 2, flex: 1, justifyContent: "center" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`nav-tab${activeTab === tab ? " active" : ""}`}
                style={{ textTransform: "capitalize" }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ── Right ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* User chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 12px 4px 4px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, transition: "background 0.22s",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--accent-lo)",
              border: "1.5px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "var(--accent)",
            }}>
              {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            <span style={{
              fontSize: 12.5, color: "var(--text-2)",
              maxWidth: 140, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.name || user?.email}
            </span>
          </div>

          {/* Bell */}
          {onBellClick && (
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                onClick={onBellClick}
                style={{
                  width: 36, height: 36, borderRadius: "var(--radius)",
                  background: unread > 0 ? "var(--accent-lo)" : "var(--bg-card)",
                  border: `1px solid ${unread > 0 ? "rgba(59,130,246,0.35)" : "var(--border)"}`,
                  color: unread > 0 ? "var(--accent)" : "var(--text-2)",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  position: "relative", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hi)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = unread > 0 ? "rgba(59,130,246,0.35)" : "var(--border)"; }}
              >
                <BellIcon />
                {unread > 0 && (
                  <span style={{
                    position: "absolute", top: -5, right: -5,
                    background: "var(--red)", color: "#fff",
                    fontSize: 9, fontWeight: 700,
                    width: 17, height: 17, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid var(--bg)",
                    animation: "pulse 2s infinite",
                  }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {showNotifications && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 10px)",
                  width: 340,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow)",
                  zIndex: 600,
                  animation: "slideDown 0.18s ease",
                  overflow: "hidden",
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--bg-subtle)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BellIcon />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        Notifications
                      </span>
                    </div>
                    {unread > 0 ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: "var(--accent)",
                        background: "var(--accent-lo)",
                        padding: "2px 8px", borderRadius: 10,
                        border: "1px solid rgba(59,130,246,0.25)",
                      }}>
                        {unread} unread
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11, color: "var(--text-3)",
                        background: "var(--bg-hover)",
                        padding: "2px 8px", borderRadius: 10,
                        border: "1px solid var(--border)",
                      }}>
                        All caught up
                      </span>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: "36px 24px", textAlign: "center",
                        color: "var(--text-3)", fontSize: 13,
                      }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>🔔</div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>No notifications yet</div>
                        <div style={{ fontSize: 12 }}>You'll be notified when issues are updated</div>
                      </div>
                    ) : (
                      notifications.map((n) => <NotifItem key={n._id} n={n} />)
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div style={{
                      padding: "10px 16px",
                      borderTop: "1px solid var(--border)",
                      background: "var(--bg-subtle)",
                      fontSize: 12, color: "var(--text-3)", textAlign: "center",
                    }}>
                      {notifications.length} total notification{notifications.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Extra actions */}
          {actions}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="uw-theme-toggle"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Logout — red */}
          <button onClick={logout} className="uw-btn-logout">
            <LogoutIcon />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
