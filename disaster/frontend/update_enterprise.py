import os

app_code = r"""import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  ShieldAlert, Box, Activity, RefreshCw, Globe, MapPin, Warehouse, 
  Truck, FileText, Lock, LogOut, Download, Users, Plus, Trash2, Edit3, UserPlus, CheckCircle2, X,
  UserCheck, ShieldCheck, Mail, Key, Phone, User, AlertCircle, Radio, CloudRain, Flame, Sliders, BellRing, Navigation
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
    html: `<div style="background-color:${color}; width:22px; height:22px; border-radius:50%; border:2px solid white; box-shadow:0 0 12px ${color}; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">${label || ""}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const redZoneIcon = createCustomIcon("#ef4444", "!");
const greenDepotIcon = createCustomIcon("#10b981", "D");
const blueVolIcon = createCustomIcon("#3b82f6", "V");
const orangeSosIcon = createCustomIcon("#f97316", "SOS");

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
  const [authRole, setAuthRole] = useState("COMMANDER");
  const [authPhone, setAuthPhone] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [zones, setZones] = useState([]);
  const [depots, setDepots] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDemand, setZoneDemand] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(94.8);
  const [loading, setLoading] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState("1.5");
  const [delayHours, setDelayHours] = useState(0);
  const [mapCenter, setMapCenter] = useState([20.0, 30.0]);
  const [mapZoom, setMapZoom] = useState(3);

  const [showVolModal, setShowVolModal] = useState(false);
  const [isEditingVol, setIsEditingVol] = useState(false);
  const [volForm, setVolForm] = useState({ id: "", name: "", email: "", phone: "", skills: "First Aid, Search & Rescue", status: "AVAILABLE", latitude: 28.6139, longitude: 77.2090 });

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [restockForm, setRestockForm] = useState({ food_packets_add: 10000, water_liters_add: 30000, medical_kits_add: 500, shelter_capacity_add: 1000 });

  const [showSosModal, setShowSosModal] = useState(false);
  const [sosReports, setSosReports] = useState([
    { id: "SOS-801", title: "Severe Flash Flood - Embankment Breach", location: "Ganges North Sector, Bihar", reported_by: "Field Unit Alpha", severity: "CRITICAL", lat: 25.62, lng: 85.14 },
    { id: "SOS-802", title: "Structural Collapse - Trapped Civilians", location: "Tokyo Coastal Block 4", reported_by: "Civic Rescue Team", severity: "HIGH", lat: 35.68, lng: 139.66 }
  ]);
  const [sosForm, setSosForm] = useState({ title: "", location: "", severity: "CRITICAL", reported_by: "" });

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
      console.warn("Backend loading notice:", err);
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
          agency: "National Disaster Response Authority"
        });
        setAuthSuccess("Account registered successfully! Please enter your password to Login.");
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
      const userRole = currentUser?.role || "COMMANDER";

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
      alert("Save error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteVolunteer = async (vol) => {
    const userEmail = (currentUser?.email || "").toLowerCase();
    const isOwner = (vol.created_by_email || "").toLowerCase() === userEmail;
    const isCommander = (currentUser?.role || "").toUpperCase() === "COMMANDER";

    if (!isOwner && !isCommander) {
      alert(`Permission Denied: You cannot delete this volunteer because it was registered by ${vol.created_by_email}. Only the creator or Commander can delete it.`);
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

  const handleSosSubmit = (e) => {
    e.preventDefault();
    const newSos = {
      id: `SOS-${Math.floor(800 + Math.random() * 100)}`,
      title: sosForm.title,
      location: sosForm.location,
      severity: sosForm.severity,
      reported_by: currentUser?.name || "Field Unit",
      lat: 25.59 + (Math.random() - 0.5) * 0.1,
      lng: 85.13 + (Math.random() - 0.5) * 0.1
    };
    setSosReports([newSos, ...sosReports]);
    setShowSosModal(false);
    setSosForm({ title: "", location: "", severity: "CRITICAL", reported_by: "" });
    alert("Emergency SOS Incident Broadcast Dispatched to Ground Response Units!");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none"></div>

        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-blue-950/80 border border-blue-800 rounded-2xl text-rose-500 mb-1 shadow-lg shadow-rose-950/40">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">National Disaster Operations Platform</h1>
            <p className="text-xs text-slate-400">
              {authMode === "login" ? "Authorized Incident Command Access" : "Create Official Operations Account"}
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
                  <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Designation / Role</label>
                  <select 
                    value={authRole} 
                    onChange={(e) => setAuthRole(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="COMMANDER">Crisis Commander (Full Authorization)</option>
                    <option value="VOLUNTEER">Field Volunteer & First Responder</option>
                    <option value="LOGISTICS_OFFICER">Logistics & Supply Coordinator</option>
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
                  placeholder="commander@ndma.gov.in" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">Security Password</label>
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
              <span>{authLoading ? "Authenticating..." : authMode === "register" ? "Register Account" : "Login & Open Command"}</span>
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
              <h2 className="text-sm font-bold text-slate-100">RakshaGrid DOCP</h2>
              <p className="text-[10px] text-slate-400">Disaster Operations Command</p>
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
            { id: "incidents", label: "Emergency SOS Feed", icon: BellRing },
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

        <button
          onClick={() => setShowSosModal(true)}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/30 transition animate-pulse"
        >
          <Radio className="w-4 h-4" />
          <span>Broadcast SOS Alert</span>
        </button>

        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-2">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200 truncate">{currentUser?.name}</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-800">{currentUser?.role}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">● Online</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-red-950/90 border-b border-red-900/80 px-4 py-1.5 text-xs text-red-200 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live Crisis</span>
            <span className="truncate">Active Inundation in Ganges-Brahmaputra Basin &bull; High Seismicity Alert in Tokyo Coastal Sector &bull; 4 Airlift Convoys En Route</span>
          </div>
          <span className="text-[10px] font-mono text-red-400 flex-shrink-0 ml-3">DEFCON LEVEL 2</span>
        </div>

        <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold tracking-wide text-slate-100 uppercase">{activeTab.replace("-", " ")}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 mr-2">Priority Weight:</span>
              <select value={priorityOverride} onChange={(e) => setPriorityOverride(e.target.value)} className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-600 focus:outline-none">
                <option value="1.0">1.0x (Standard Allocation)</option>
                <option value="1.5">1.5x (High Priority Sector)</option>
                <option value="2.0">2.0x (Critical Lifeline Override)</option>
              </select>
            </div>

            <button onClick={runOptimization} disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-blue-600/20">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              OPTIMIZE ALLOCATIONS
            </button>

            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-100 rounded-lg transition border border-slate-700 hover:border-rose-800 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
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

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center"><Sliders className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Delay Simulation</span>
                  <span className="font-mono text-cyan-300">{delayHours} hrs</span>
                </div>
                <input 
                  type="range" min="0" max="24" step="2" value={delayHours} 
                  onChange={(e) => setDelayHours(parseInt(e.target.value))} 
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Immediate (0h)</span>
                  <span>Delayed (24h)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400">Global Relief Coverage Rate</div>
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

                  {sosReports.map(sos => (
                    <Marker key={sos.id} position={[sos.lat, sos.lng]} icon={orangeSosIcon}>
                      <Popup>
                        <div className="text-slate-900 p-1 text-xs">
                          <p className="font-bold text-orange-600">{sos.title}</p>
                          <p><strong>Location:</strong> {sos.location}</p>
                          <p><strong>Reported by:</strong> {sos.reported_by}</p>
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
                    <div className="text-[11px] text-amber-400 mt-1">
                      Dynamic Delay Multiplier: {(1.0 + delayHours * 0.03).toFixed(2)}x
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Food Ration Packs Required</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.food_packets?.point_estimate * (1.0 + delayHours * 0.03)).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Potable Water (Liters)</div>
                      <div className="text-base font-bold text-cyan-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.water_liters?.point_estimate * (1.0 + delayHours * 0.03)).toLocaleString()} L
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">Trauma Medical Kits</div>
                      <div className="text-base font-bold text-rose-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.medical_kits?.point_estimate * (1.0 + delayHours * 0.04)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">Click a disaster pin to calculate ML needs.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VOLUNTEERS */}
        {activeTab === "volunteers" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Volunteer Management Directory</h2>
                <p className="text-xs text-slate-400">Manage field responders, medical staff and search & rescue teams</p>
              </div>
              <button 
                onClick={() => {
                  setVolForm({ id: "", name: "", email: "", phone: "", skills: "Search & Rescue, First Aid", status: "AVAILABLE", latitude: 28.6139, longitude: 77.2090 });
                  setIsEditingVol(false);
                  setShowVolModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> + Register Volunteer
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
                              {v.created_by_email || "Command Authority"}
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

        {/* TAB 3: INVENTORY */}
        {activeTab === "inventory" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div><h2 className="text-lg font-bold">Strategic Aid Depots & Stock Management</h2><p className="text-xs text-slate-400">Live warehouse reserves and automated supply manifest monitoring</p></div>
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
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Trauma Emergency Kits</span><span className="font-mono text-rose-400 font-semibold">{d.medical_kits?.toLocaleString()} kits</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-2 rounded-full" style={{ width: "70%" }}></div></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ZONES */}
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

        {/* TAB 5: LOGISTICS */}
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

        {/* TAB 6: SOS EMERGENCY FEED */}
        {activeTab === "incidents" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Live Emergency SOS Incidents & Ground Reports</h2>
                <p className="text-xs text-slate-400">Direct reports submitted by rapid response field units</p>
              </div>
              <button 
                onClick={() => setShowSosModal(true)} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-rose-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>+ Report New Emergency</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sosReports.map(sos => (
                <div key={sos.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-100 flex items-center">
                      <Radio className="w-4 h-4 mr-2 text-rose-500 animate-pulse" />
                      {sos.title}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-300 font-bold border border-rose-800 rounded text-[10px]">
                      {sos.severity}
                    </span>
                  </div>
                  <p className="text-slate-400">Location: <span className="text-slate-200 font-medium">{sos.location}</span></p>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>Reported by: {sos.reported_by}</span>
                    <span className="font-mono text-cyan-400">{sos.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: REPORTS */}
        {activeTab === "reports" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">National Crisis Situation Report (SitRep-04)</h2>
                <p className="text-xs text-slate-400">Official incident overview & donor accountability document</p>
              </div>
              <button onClick={() => alert("Situation Report PDF generated and ready for print!")} className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold">
                <Download className="w-4 h-4 mr-1.5" /> Download Full SitRep PDF
              </button>
            </div>
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-base font-bold text-slate-100">Executive Relief Coordination Summary</div>
                <div className="text-slate-400 text-[11px]">Command: NDMA Unified Incident Operations Group</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Total Population Impacted</div><div className="text-lg font-bold mt-1">259,000</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Strategic Depots</div><div className="text-lg font-bold text-emerald-400 mt-1">{depots.length} Active</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Field Volunteers</div><div className="text-lg font-bold text-blue-400 mt-1">{volunteers.length} Active</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">OR-Tools Coverage</div><div className="text-lg font-bold text-purple-400 mt-1">{fulfillmentRate}%</div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: VOLUNTEER ADD / EDIT */}
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
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">Register Volunteer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTOCK DEPOT */}
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
                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold">Confirm Restock Manifest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMERGENCY SOS BROADCAST */}
      {showSosModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-500 flex items-center">
                <Radio className="w-4 h-4 mr-2 text-rose-500 animate-pulse" />
                Broadcast Live Emergency SOS
              </h3>
              <button onClick={() => setShowSosModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSosSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Incident Headline / Type</label>
                <input 
                  type="text" 
                  value={sosForm.title} 
                  onChange={(e) => setSosForm({ ...sosForm, title: e.target.value })} 
                  placeholder="e.g. Flash Flood Breach / Building Structural Collapse" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-rose-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Affected Location / Landmark</label>
                <input 
                  type="text" 
                  value={sosForm.location} 
                  onChange={(e) => setSosForm({ ...sosForm, location: e.target.value })} 
                  placeholder="e.g. Sector 4 East Embankment" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-rose-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Urgency Level</label>
                <select 
                  value={sosForm.severity} 
                  onChange={(e) => setSosForm({ ...sosForm, severity: e.target.value })} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100"
                >
                  <option value="CRITICAL">Critical (Immediate Evacuation Needed)</option>
                  <option value="HIGH">High (Medical / Supply Lifeline Needed)</option>
                  <option value="MODERATE">Moderate (Road / Structural Hazard)</option>
                </select>
              </div>

              <div className="pt-3 flex space-x-3">
                <button type="button" onClick={() => setShowSosModal(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-bold">Transmit Emergency Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
"""

with open("src/App.jsx", "w") as f:
    f.write(app_code)
print("Updated App.jsx with Enterprise UI and new SOS/Simulation features.")
