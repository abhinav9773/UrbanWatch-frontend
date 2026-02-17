import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Fix marker icons */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function CitizenDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const mapRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "ROAD",
    severity: 3,
    lat: "",
    lng: "",
  });

  const { user, logout } = useAuth();

  /* ============================ */
  /* Load Issues */
  /* ============================ */
  useEffect(() => {
    fetchMyIssues();
  }, []);

  /* ============================ */
  /* Auto fit map */
  /* ============================ */
  useEffect(() => {
    if (!mapRef.current) return;
    if (issues.length === 0) return;

    const bounds = issues
      .filter((i) => i.location?.coordinates)
      .map((i) => {
        const [lng, lat] = i.location.coordinates;
        return [lat, lng];
      });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(bounds, {
        padding: [40, 40],
      });
    }
  }, [issues]);

  /* ============================ */
  /* Fetch Issues */
  /* ============================ */
  const fetchMyIssues = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get("/issues/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIssues(res.data);
    } catch {
      toast.error("Failed to load issues ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ============================ */
  /* GPS Detect */
  /* ============================ */
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported ❌");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        });

        toast.success("Location detected 📍");
      },
      () => {
        toast.error("Location denied ❌");
      },
    );
  };

  /* ============================ */
  /* Submit */
  /* ============================ */
  const submitIssue = async () => {
    try {
      if (!form.title || !form.lat || !form.lng) {
        toast.error("Fill required fields ⚠️");
        return;
      }

      const token = localStorage.getItem("token");

      await api.post(
        "/issues",
        {
          title: form.title,
          description: form.description,
          category: form.category,
          severity: Number(form.severity),

          location: {
            type: "Point",
            coordinates: [Number(form.lng), Number(form.lat)],
          },

          reportedBy: user._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Issue reported 🚀");

      setForm({
        title: "",
        description: "",
        category: "ROAD",
        severity: 3,
        lat: "",
        lng: "",
      });

      setShowForm(false);

      fetchMyIssues();
    } catch (err) {
      console.error(err);
      toast.error("Submit failed ❌");
    }
  };

  /* ============================ */
  /* Helpers */
  /* ============================ */
  const getRemainingTime = (dueAt) => {
    if (!dueAt) return "N/A";

    const diff = new Date(dueAt) - new Date();

    if (diff <= 0) return "⛔ Overdue";

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    return `${h}h ${m}m`;
  };

  const getStatusColor = (s) => {
    if (s === "REPORTED") return "bg-gray-500/20 text-gray-300";
    if (s === "VERIFIED") return "bg-yellow-500/20 text-yellow-300";
    if (s === "IN_PROGRESS") return "bg-blue-500/20 text-blue-300";
    if (s === "RESOLVED") return "bg-green-500/20 text-green-300";
    return "bg-gray-500/20 text-gray-300";
  };

  /* ============================ */
  /* UI */
  /* ============================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-black text-white">
      {/* NAVBAR */}
      <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
              {user?.email?.[0]?.toUpperCase()}
            </div>

            <div>
              <h1 className="text-lg font-semibold">Citizen Dashboard</h1>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
            >
              + Report
            </button>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowForm(false)} // 👈 Close on outside click
        >
          <div
            className="glass p-6 rounded-2xl w-[420px] space-y-3 border border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()} // 👈 Prevent closing when clicking inside
          >
            <h2 className="text-xl font-bold text-center">Report Issue</h2>

            <input
              placeholder="Title"
              className="w-full p-2 bg-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              placeholder="Description"
              className="w-full p-2 bg-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <select
              className="w-full p-2 bg-white/10 rounded-lg"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>ROAD</option>
              <option>WATER</option>
              <option>LIGHTING</option>
              <option>SANITATION</option>
              <option>OTHER</option>
            </select>

            <select
              className="w-full p-2 bg-white/10 rounded-lg"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            >
              <option value={5}>Critical</option>
              <option value={4}>High</option>
              <option value={3}>Medium</option>
              <option value={2}>Low</option>
              <option value={1}>Very Low</option>
            </select>

            <input
              value={form.lat}
              readOnly
              placeholder="Latitude"
              className="w-full p-2 bg-white/10 rounded-lg"
            />

            <input
              value={form.lng}
              readOnly
              placeholder="Longitude"
              className="w-full p-2 bg-white/10 rounded-lg"
            />
            <button
              onClick={detectLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition"
            >
              📍 Use Location
            </button>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitIssue}
                className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg transition"
              >
                Submit
              </button>

              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP */}
      {!showForm && (
        <div className="max-w-7xl mx-auto mt-8 h-[420px] rounded-2xl overflow-hidden border border-white/10 shadow-lg glass">
          <MapContainer
            center={[28.6139, 77.209]}
            zoom={11}
            className="h-full w-full"
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
      )}

      {/* CARDS */}
      <div className="max-w-7xl mx-auto p-6">
        {loading && <p className="text-center text-gray-400">Loading...</p>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="glass border border-white/10 rounded-2xl p-5 hover:scale-[1.02] hover:shadow-xl transition"
            >
              <h2 className="font-semibold mb-2">{issue.title}</h2>

              <span
                className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                  issue.status,
                )}`}
              >
                {issue.status}
              </span>

              <div className="text-sm text-gray-400 mt-3 space-y-1">
                <p>Category: {issue.category}</p>
                <p>Priority: {issue.priorityScore}</p>
                <p>⏱️ {getRemainingTime(issue.dueAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
