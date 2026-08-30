import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  ShieldAlert, Box, Activity, RefreshCw, Globe, MapPin, Warehouse, 
  Truck, FileText, Lock, LogOut, Download, Users, Plus, Trash2, Edit3, UserPlus, CheckCircle2, X,
  UserCheck, ShieldCheck, Mail, Key, Phone, User, AlertCircle
} from "lucide-react";
import axios from "axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (color, label) => {
  return new L.DivIcon({
    className: "custom-pin",
    html: `<div style="background-color:${color}; width:22px; height:22px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">${label || ""}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const redZoneIcon = createCustomIcon("#ef4444", "!");
const greenDepotIcon = createCustomIcon("#10b981", "D");
const blueVolIcon = createCustomIcon("#3b82f6", "V");

const API_BASE = "/api/v1";

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 3, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("VOLUNTEER");
  const [authPhone, setAuthPhone] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [zones, setZones] = useState([]);
  const [depots, setDepots] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDemand, setZoneDemand] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState("1.5");
  const [mapCenter, setMapCenter] = useState([20.0, 30.0]);
  const [mapZoom, setMapZoom] = useState(3);

  const [showVolModal, setShowVolModal] = useState(false);
  const [isEditingVol, setIsEditingVol] = useState(false);
  const [volForm, setVolForm] = useState({ id: "", name: "", email: "", phone: "", skills: "First Aid, Search & Rescue", status: "AVAILABLE", latitude: 28.6139, longitude: 77.2090 });

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [restockForm, setRestockForm] = useState({ food_packets_add: 10000, water_liters_add: 30000, medical_kits_add: 500, shelter_capacity_add: 1000 });

  useEffect(() => {
    const savedUser = localStorage.getItem("docp_session_user");
    const savedToken = localStorage.getItem("docp_session_token");
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("docp_session_user");
        localStorage.removeItem("docp_session_token");
      }
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [zRes, dRes, vRes] = await Promise.all([
        axios.get(`${API_BASE}/zones`),
        axios.get(`${API_BASE}/depots`),
        axios.get(`${API_BASE}/volunteers`)
      ]);
      setZones(zRes.data);
      setDepots(dRes.data);
      setVolunteers(vRes.data);
      if (zRes.data.length > 0) inspectZone(zRes.data[0].id, zRes.data);
    } catch (err) {
      console.warn("Backend notice:", err);
    }
  };

  const inspectZone = async (zoneId, currentZones = zones) => {
    setSelectedZone(zoneId);
    const target = currentZones.find(z => z.id === zoneId);
    if (target) {
      setMapCenter([target.latitude, target.longitude]);
      setMapZoom(5);
    }
    try {
      const res = await axios.get(`${API_BASE}/predict/demand/${zoneId}`);
      setZoneDemand(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      const payload = {
        zone_ids: zones.map(z => z.id),
        depot_ids: depots.map(d => d.id),
        priority_overrides: selectedZone ? { [selectedZone]: parseFloat(priorityOverride) } : {}
      };
      const res = await axios.post(`${API_BASE}/optimize/allocation`, payload);
      const validAllocations = res.data.allocations.map(a => {
        const dep = depots.find(d => d.id === a.depot_id);
        const zon = zones.find(z => z.id === a.zone_id);
        return {
          ...a,
          startLat: dep ? dep.latitude : 28.6139,
          startLng: dep ? dep.longitude : 77.2090,
          endLat: zon ? zon.latitude : 25.5941,
          endLng: zon ? zon.longitude : 85.1376,
        };
      });
      setAllocations(validAllocations);
      setFulfillmentRate(res.data.total_fulfillment_rate || 96.4);
      setMapCenter([20.0, 30.0]);
      setMapZoom(3);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (authMode === "register") {
        await axios.post(`${API_BASE}/auth/register`, {
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
          phone: authPhone,
          agency: "Disaster Response Volunteer Force"
        });
        setAuthSuccess("Registration successful in Neon DB! Please enter your password to Login.");
        setAuthMode("login");
        setAuthPassword("");
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email: authEmail,
          password: authPassword
        });
        const userData = res.data.user;
        const token = res.data.token;
        localStorage.setItem("docp_session_user", JSON.stringify(userData));
        localStorage.setItem("docp_session_token", token);
        setCurrentUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication error. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("docp_session_user");
    localStorage.removeItem("docp_session_token");
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError("");
    setAuthSuccess("");
    setAuthPassword("");
  };

  const handleSaveVolunteer = async (e) => {
    e.preventDefault();
    try {
      const userEmail = currentUser?.email || "commander@ndma.gov.in";
      const userRole = currentUser?.role || "VOLUNTEER";

      const payload = {
        ...volForm,
        latitude: parseFloat(volForm.latitude) || 28.6139,
        longitude: parseFloat(volForm.longitude) || 77.2090,
        created_by_email: userEmail
      };

      if (isEditingVol) {
        await axios.put(`${API_BASE}/volunteers/${volForm.id}?requester_email=${userEmail}&requester_role=${userRole}`, {
          ...payload,
          requester_email: userEmail,
          requester_role: userRole
        });
      } else {
        await axios.post(`${API_BASE}/volunteers`, payload);
      }
      setShowVolModal(false);
      const res = await axios.get(`${API_BASE}/volunteers`);
      setVolunteers(res.data);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteVolunteer = async (vol) => {
    const userEmail = (currentUser?.email || "").toLowerCase();
    const isOwner = (vol.created_by_email || "").toLowerCase() === userEmail;
    const isCommander = (currentUser?.role || "").toUpperCase() === "COMMANDER";

    if (!isOwner && !isCommander) {
      alert(`Permission Denied: You cannot delete this volunteer because it was registered by ${vol.created_by_email}. Only the creator can delete it.`);
      return;
    }

    if (window.confirm(`Delete volunteer ${vol.name}?`)) {
      try {
        await axios.delete(`${API_BASE}/volunteers/${vol.id}?requester_email=${userEmail}&requester_role=${currentUser?.role}`);
        setVolunteers(volunteers.filter(v => v.id !== vol.id));
      } catch (err) {
        alert("Delete failed: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/depots/${selectedDepotId}/restock`, restockForm);
      setShowRestockModal(false);
      const res = await axios.get(`${API_BASE}/depots`);
      setDepots(res.data);
    } catch (err) {
      alert("Restock failed: " + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-blue-950 border border-blue-800 rounded-2xl text-rose-500 mb-1">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Disaster Operations Command Platform</h1>
            <p className="text-xs text-slate-400">
              {authMode === "login" ? "Login with your Registered Account" : "Register New Account in Neon PostgreSQL"}
            </p>
          </div>

          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
              className={`py-2.5 rounded-lg font-bold transition ${authMode === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
              className={`py-2.5 rounded-lg font-bold transition ${authMode === "register" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
            >
              Register
            </button>
          </div>

          {authSuccess && (
            <div className="p-3 bg-emerald-950/90 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-950/90 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      value={authName} 
                      onChange={(e) => setAuthName(e.target.value)} 
                      placeholder="e.g. Raviranjan Kumar" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="text" 
                      value={authPhone} 
                      onChange={(e) => setAuthPhone(e.target.value)} 
                      placeholder="+91 9876543210" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Account Role</label>
                  <select 
                    value={authRole} 
                    onChange={(e) => setAuthRole(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="VOLUNTEER">Field Volunteer (Manages own volunteers)</option>
                    <option value="LOGISTICS_OFFICER">Logistics Coordinator</option>
                    <option value="COMMANDER">Crisis Commander (Supervisor Access)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Official Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  placeholder="user@relief.org" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-xl text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 mr-1" />
              <span>{authLoading ? "Processing..." : authMode === "register" ? "Register Account" : "Login & Open Command"}</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">DOCP Global</h2>
              <p className="text-[10px] text-slate-400">Disaster Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">Operations Menu</div>
          {[
            { id: "dashboard", label: "Global Command Map", icon: Globe },
            { id: "volunteers", label: "Volunteer Management", icon: Users },
            { id: "inventory", label: "Depots & Stocks", icon: Warehouse },
            { id: "zones", label: "Disaster Impact Zones", icon: MapPin },
            { id: "logistics", label: "Logistics Dispatch", icon: Truck },
            { id: "reports", label: "Situation Reports", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "dashboard") { setMapCenter([20.0, 30.0]); setMapZoom(3); }
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200 truncate">{currentUser?.name}</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-800">{currentUser?.role}</span>
            <span className="text-[10px] text-slate-500">Active</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold tracking-wide text-slate-100 uppercase">{activeTab.replace("-", " ")}</h1>
            <span className="text-[10px] bg-red-950 text-red-300 px-2.5 py-0.5 rounded-full border border-red-800 font-semibold animate-pulse">
              LIVE CRISIS ACTIVE
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 mr-2">Priority Weight:</span>
              <select value={priorityOverride} onChange={(e) => setPriorityOverride(e.target.value)} className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-600 focus:outline-none">
                <option value="1.0">1.0x (Standard)</option>
                <option value="1.5">1.5x (High Priority)</option>
                <option value="2.0">2.0x (Critical Lifeline)</option>
              </select>
            </div>

            <button onClick={runOptimization} disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-blue-600/20">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              RUN OR-TOOLS OPTIMIZER
            </button>

            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-100 rounded-lg transition border border-slate-700 hover:border-rose-800 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden p-4 gap-4">
            <div className="md:col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Warehouse className="w-4 h-4 mr-2 text-indigo-400" /> Strategic Aid Depots
                </h2>
                <button onClick={() => { setSelectedDepotId(depots[0]?.id || ""); setShowRestockModal(true); }} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold">
                  + Restock
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {depots.map(d => (
                  <div key={d.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/70 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-200 flex justify-between">
                      <span>{d.name}</span>
                      <button onClick={() => { setSelectedDepotId(d.id); setShowRestockModal(true); }} className="text-[10px] text-blue-400 hover:underline">Add Stock</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                      <div className="text-slate-400">Food: <span className="text-emerald-400 font-mono">{d.food_packets?.toLocaleString()}</span></div>
                      <div className="text-slate-400">Water: <span className="text-cyan-400 font-mono">{d.water_liters?.toLocaleString()}L</span></div>
                      <div className="text-slate-400">Med Kits: <span className="text-rose-400 font-mono">{d.medical_kits}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400">Global Relief Coverage</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{fulfillmentRate}%</div>
              </div>
            </div>

            <div className="md:col-span-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl flex flex-col">
              <div className="flex-1 w-full h-full min-h-[480px]">
                <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  {zones.map(z => (
                    <Marker key={z.id} position={[z.latitude, z.longitude]} icon={redZoneIcon}>
                      <Popup>
                        <div className="text-slate-900 p-1 text-xs">
                          <p className="font-bold text-sm text-red-600">{z.name}</p>
                          <p><strong>Disaster:</strong> {z.disaster_type}</p>
                          <p><strong>Severity:</strong> {z.severity_score}/10</p>
                          <button onClick={() => inspectZone(z.id)} className="mt-2 w-full py-1 bg-blue-600 text-white font-semibold rounded text-xs">Calculate AI Demand</button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {depots.map(d => (
                    <Marker key={d.id} position={[d.latitude, d.longitude]} icon={greenDepotIcon}>
                      <Popup>
                        <div className="text-slate-900 p-1 text-xs">
                          <p className="font-bold text-emerald-700">{d.name}</p>
                          <p>Food: {d.food_packets?.toLocaleString()} | Water: {d.water_liters?.toLocaleString()}L</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {volunteers.map(v => v.latitude && (
                    <Marker key={v.id} position={[v.latitude, v.longitude]} icon={blueVolIcon}>
                      <Popup>
                        <div className="text-slate-900 p-1 text-xs">
                          <p className="font-bold text-blue-700">{v.name} ({v.id})</p>
                          <p>Skills: {v.skills}</p>
                          <p>Registered by: {v.created_by_email}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {allocations.map((alloc, idx) => (
                    <Polyline key={idx} positions={[[alloc.startLat, alloc.startLng], [alloc.endLat, alloc.endLng]]} color="#00f0ff" weight={4} dashArray="6, 8" />
                  ))}
                </MapContainer>
              </div>
            </div>

            <div className="md:col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-rose-400" /> AI Demand Engine
                </h2>
                {zoneDemand && <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800 font-semibold">Sev: {zoneDemand.severity_score}</span>}
              </div>

              {zoneDemand ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <div className="text-xs text-slate-400">Target Sector</div>
                    <div className="text-sm font-bold text-slate-100">{zoneDemand.zone_name || zoneDemand.zone_id}</div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Food Ration Packs Required</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">{zoneDemand.predicted_needs?.food_packets?.point_estimate?.toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Potable Water (Liters)</div>
                      <div className="text-base font-bold text-cyan-400 font-mono">{zoneDemand.predicted_needs?.water_liters?.point_estimate?.toLocaleString()} L</div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Trauma Medical Kits</div>
                      <div className="text-base font-bold text-rose-400 font-mono">{zoneDemand.predicted_needs?.medical_kits?.point_estimate?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">Click a disaster pin to calculate ML needs.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "volunteers" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Volunteer Management Directory (Neon DB)</h2>
                <p className="text-xs text-slate-400">You can add volunteers and edit/delete entries registered by your account</p>
              </div>
              <button 
                onClick={() => {
                  setVolForm({ id: "", name: "", email: "", phone: "", skills: "Search & Rescue, First Aid", status: "AVAILABLE", latitude: 28.6139, longitude: 77.2090 });
                  setIsEditingVol(false);
                  setShowVolModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> + Add New Volunteer
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Volunteer ID</th>
                    <th className="p-3.5">Full Name</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Skills</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered By</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {volunteers.map((v) => {
                    const userEmail = (currentUser?.email || "").toLowerCase();
                    const isOwner = (v.created_by_email || "").toLowerCase() === userEmail;
                    const isCommander = (currentUser?.role || "").toUpperCase() === "COMMANDER";
                    const canModify = isOwner || isCommander;

                    return (
                      <tr key={v.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3.5 font-mono text-blue-400 font-semibold">{v.id}</td>
                        <td className="p-3.5 font-bold text-slate-100">{v.name}</td>
                        <td className="p-3.5 text-slate-400">{v.email}<br/><span className="text-[11px] text-slate-500">{v.phone}</span></td>
                        <td className="p-3.5">{v.skills}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === "AVAILABLE" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                            v.status === "DEPLOYED" ? "bg-blue-950 text-blue-400 border border-blue-800" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isOwner ? (
                            <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                              ✓ You (Owner)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] truncate max-w-[140px] block" title={v.created_by_email}>
                              {v.created_by_email || "System"}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {canModify ? (
                            <>
                              <button 
                                onClick={() => { setVolForm(v); setIsEditingVol(true); setShowVolModal(true); }} 
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition font-medium"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteVolunteer(v)} 
                                className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded transition border border-rose-800 font-medium"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              🔒 Read Only (Not Owner)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div><h2 className="text-lg font-bold">Strategic Aid Depots & Stock Management</h2><p className="text-xs text-slate-400">Real-time inventory levels stored in Neon Serverless DB</p></div>
              <button onClick={() => { setSelectedDepotId(depots[0]?.id || ""); setShowRestockModal(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold">+ Restock Supplies</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {depots.map((d) => (
                <div key={d.id} className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold text-sm text-slate-100">{d.name}</h3><p className="text-xs text-slate-400 font-mono">{d.id}</p></div>
                    <button onClick={() => { setSelectedDepotId(d.id); setShowRestockModal(true); }} className="px-3 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded text-xs font-semibold border border-blue-700">Restock Hub</button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Food Ration Packs</span><span className="font-mono text-emerald-400 font-semibold">{d.food_packets?.toLocaleString()} units</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: "80%" }}></div></div></div>
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Potable Water</span><span className="font-mono text-cyan-400 font-semibold">{d.water_liters?.toLocaleString()} L</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-cyan-500 h-2 rounded-full" style={{ width: "90%" }}></div></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "zones" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h2 className="text-lg font-bold">Disaster Impact Zones</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr><th className="p-3.5">Zone Code</th><th className="p-3.5">Location</th><th className="p-3.5">Disaster</th><th className="p-3.5">Severity</th><th className="p-3.5">Population</th><th className="p-3.5 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {zones.map((z) => (
                    <tr key={z.id} className="hover:bg-slate-800/50">
                      <td className="p-3.5 font-mono text-blue-400">{z.id}</td><td className="p-3.5 font-semibold text-slate-100">{z.name}</td><td className="p-3.5">{z.disaster_type}</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400">{z.severity_score} / 10.0</span></td>
                      <td className="p-3.5 font-mono">{z.population?.toLocaleString()}</td>
                      <td className="p-3.5 text-right"><button onClick={() => { inspectZone(z.id); setActiveTab("dashboard"); }} className="px-3 py-1 bg-slate-800 hover:bg-blue-600 rounded text-[11px]">Focus & Inspect</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "logistics" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Logistics & Route Dispatch Manifests</h2>
              <button onClick={runOptimization} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold">Re-calculate</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allocations.map((a, i) => (
                <div key={i} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-blue-400 font-bold">
                    <span><Truck className="w-4 h-4 inline mr-1" /> Mission #{i + 101}</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded">Coverage: {a.coverage_percentage}%</span>
                  </div>
                  <div className="text-slate-300"><strong>Hub:</strong> {a.depot_id} &rarr; <span className="text-amber-400">{a.zone_id}</span></div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-2 rounded text-[11px]">
                    <div>Food: <strong className="text-emerald-400">{a.allocated_food?.toLocaleString()}</strong></div>
                    <div>Water: <strong className="text-cyan-400">{a.allocated_water?.toLocaleString()}L</strong></div>
                    <div>Med: <strong className="text-rose-400">{a.allocated_medical}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">International Situation Report (SitRep)</h2>
              <button onClick={() => alert("Situation Report PDF downloaded!")} className="flex items-center px-4 py-2 bg-emerald-600 rounded-lg text-xs font-semibold">
                <Download className="w-4 h-4 mr-1.5" /> Download Full SitRep PDF
              </button>
            </div>
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 text-xs">
              <div className="text-sm font-bold text-slate-100">National Emergency Operations Summary</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Impacted Pop</div><div className="text-lg font-bold mt-1">259,000</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Strategic Hubs</div><div className="text-lg font-bold text-emerald-400 mt-1">{depots.length}</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Active Volunteers</div><div className="text-lg font-bold text-blue-400 mt-1">{volunteers.length}</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Coverage</div><div className="text-lg font-bold text-purple-400 mt-1">{fulfillmentRate}%</div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VOLUNTEER ADD / EDIT MODAL */}
      {showVolModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-blue-400" />
                {isEditingVol ? "Edit Volunteer Profile" : "Register New Field Volunteer"}
              </h3>
              <button onClick={() => setShowVolModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveVolunteer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input type="text" value={volForm.name} onChange={(e) => setVolForm({ ...volForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input type="text" value={volForm.phone} onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input type="email" value={volForm.email} onChange={(e) => setVolForm({ ...volForm, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specialized Skills</label>
                <input type="text" value={volForm.skills} onChange={(e) => setVolForm({ ...volForm, skills: e.target.value })} placeholder="Paramedic, Drone Search, Driver" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select value={volForm.status} onChange={(e) => setVolForm({ ...volForm, status: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100">
                    <option value="AVAILABLE">Available</option>
                    <option value="DEPLOYED">Deployed</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Latitude</label>
                  <input type="number" step="any" value={volForm.latitude} onChange={(e) => setVolForm({ ...volForm, latitude: parseFloat(e.target.value) || 28.6139 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Longitude</label>
                  <input type="number" step="any" value={volForm.longitude} onChange={(e) => setVolForm({ ...volForm, longitude: parseFloat(e.target.value) || 77.2090 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" />
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button type="button" onClick={() => setShowVolModal(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">Save In Neon DB</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {showRestockModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <Warehouse className="w-4 h-4 mr-2 text-emerald-400" /> Restock Depot Supplies
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Target Depot</label>
                <select value={selectedDepotId} onChange={(e) => setSelectedDepotId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100">
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Add Food Packets</label>
                  <input type="number" value={restockForm.food_packets_add} onChange={(e) => setRestockForm({ ...restockForm, food_packets_add: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Add Water (Liters)</label>
                  <input type="number" value={restockForm.water_liters_add} onChange={(e) => setRestockForm({ ...restockForm, water_liters_add: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Add Trauma Med Kits</label>
                  <input type="number" value={restockForm.medical_kits_add} onChange={(e) => setRestockForm({ ...restockForm, medical_kits_add: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Add Shelter Tents</label>
                  <input type="number" value={restockForm.shelter_capacity_add} onChange={(e) => setRestockForm({ ...restockForm, shelter_capacity_add: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono" />
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button type="button" onClick={() => setShowRestockModal(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold">Update Stock In DB</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
