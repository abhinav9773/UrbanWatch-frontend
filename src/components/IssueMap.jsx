import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_CFG = {
  REPORTED:    { color: "#71717a", label: "Reported"    },
  VERIFIED:    { color: "#f59e0b", label: "Verified"    },
  IN_PROGRESS: { color: "#3b82f6", label: "In Progress" },
  RESOLVED:    { color: "#22c55e", label: "Resolved"    },
};

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:13px;height:13px;border-radius:50%;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.85);
      box-shadow:0 0 10px ${color}90, 0 2px 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

export default function IssueMap({ issues, style = {} }) {
  const center = [28.61, 77.21];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", ...style }}
    >
      {/* Dark CartoDB tiles — same for all dashboards */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {issues.map((issue) => {
        if (!issue.location?.coordinates) return null;
        const [lng, lat] = issue.location.coordinates;
        const cfg = STATUS_CFG[issue.status] || STATUS_CFG.REPORTED;

        return (
          <Marker key={issue._id} position={[lat, lng]} icon={makeIcon(cfg.color)}>
            <Popup>
              <div style={{
                fontFamily: "'Geist', 'Inter', sans-serif",
                minWidth: 180,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>
                  {issue.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#a1a1aa" }}>Status</span>
                    <span style={{ color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#a1a1aa" }}>Category</span>
                    <span style={{ fontWeight: 500 }}>{issue.category || "—"}</span>
                  </div>
                  {issue.priorityScore !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#a1a1aa" }}>Priority</span>
                      <span style={{ fontWeight: 600 }}>{issue.priorityScore}</span>
                    </div>
                  )}
                  {issue.upvotes?.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#a1a1aa" }}>Upvotes</span>
                      <span style={{ color: "#a78bfa", fontWeight: 500 }}>▲ {issue.upvotes.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
