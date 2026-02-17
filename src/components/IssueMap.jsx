import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix marker icon bug
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function IssueMap({ issues }) {
  // Default center: Delhi
  const center = [28.61, 77.21];

  return (
    <div className="glass p-4 h-[400px]">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full rounded-xl"
      >
        {/* Map Tiles */}
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Markers */}
        {issues.map((issue) => (
          <Marker
            key={issue._id}
            position={[
              issue.location.coordinates[1], // lat
              issue.location.coordinates[0], // lng
            ]}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold mb-1">{issue.title}</h3>

                <p>Status: {issue.status}</p>
                <p>Priority: {issue.priorityScore}</p>
                <p>Category: {issue.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
