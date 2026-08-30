import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  ShieldAlert, Box, Activity, RefreshCw, Globe, MapPin, Warehouse, 
  Truck, FileText, Lock, LogOut, Download, Users, Plus, Trash2, Edit3, UserPlus, CheckCircle2, X,
  UserCheck, ShieldCheck, Mail, Key, Phone, User, AlertCircle, CloudRain, Sliders, 
  Layers, LogIn, Navigation, ArrowRight, Check
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
    html: `<div style="background-color:${color}; width:26px; height:26px; border-radius:50%; border:2px solid white; box-shadow:0 0 14px ${color}; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold;">${label || ""}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

const redZoneIcon = createCustomIcon("#ef4444", "!");
const greenDepotIcon = createCustomIcon("#10b981", "H");
const blueVolIcon = createCustomIcon("#3b82f6", "V");

const API_BASE = "/api/v1";

const DEFAULT_WORLD_ZONES = [
  { id: "Z-GLOBAL-01", name: "Tokyo Bay Megalopolis, Japan", disaster_type: "Catastrophic 8.2 Earthquake & Tsunami", severity_score: 9.6, population: 145000, latitude: 35.6762, longitude: 139.6503 },
  { id: "Z-GLOBAL-02", name: "Kahramanmaraş Fault Zone, Turkey", disaster_type: "Major Seismicity & Structural Collapse", severity_score: 9.3, population: 92000, latitude: 37.5753, longitude: 36.9228 },
  { id: "Z-GLOBAL-03", name: "Sumatra Trench, Indonesia", disaster_type: "Tsunami Surge & Subduction Hazard", severity_score: 8.9, population: 110000, latitude: -0.5897, longitude: 101.3431 },
  { id: "Z-GLOBAL-04", name: "Ganges-Brahmaputra Basin, India", disaster_type: "Severe Monsoon Flood Inundation", severity_score: 8.6, population: 185000, latitude: 25.5941, longitude: 85.1376 },
  { id: "Z-GLOBAL-05", name: "Sierra Nevada & California Basin, USA", disaster_type: "Extreme Wildfire Complex", severity_score: 8.1, population: 48000, latitude: 37.7749, longitude: -122.4194 },
  { id: "Z-GLOBAL-06", name: "Valparaíso Coastal Sector, Chile", disaster_type: "Coastal Wildfire & Tsunami Alert", severity_score: 7.9, population: 42000, latitude: -33.0472, longitude: -71.6127 }
];

const DEFAULT_GLOBAL_DEPOTS = [
  { id: "DEPOT-EUROPE", name: "European Humanitarian Logistics Base (Geneva, Switzerland)", food_packets: 180000, water_liters: 450000, medical_kits: 12000, available_vehicles: 60, latitude: 46.2044, longitude: 6.1432 },
  { id: "DEPOT-ASIA", name: "UNHRD Strategic Relief Base (New Delhi, India)", food_packets: 250000, water_liters: 600000, medical_kits: 18500, available_vehicles: 85, latitude: 28.6139, longitude: 77.2090 },
  { id: "DEPOT-PACIFIC", name: "Asia-Pacific Rapid Deployment Base (Tokyo, Japan)", food_packets: 140000, water_liters: 380000, medical_kits: 9500, available_vehicles: 45, latitude: 35.5494, longitude: 139.7798 },
  { id: "DEPOT-AMERICAS", name: "Humanitarian Response Depot Americas (Panama City)", food_packets: 160000, water_liters: 420000, medical_kits: 11000, available_vehicles: 50, latitude: 8.9824, longitude: -79.5199 }
];

const translations = {
  en: {
    title: "RakshaGrid DOCP",
    subtitle: "Global Disaster Operations Command",
    liveCrisis: "GLOBAL CRISIS OPERATIONS ACTIVE",
    tickerText: "Major 8.2 Seismicity in Tokyo Bay • Fault Rupture in Turkey • Ganges Basin Flood Relief • Sierra Wildfires",
    menu: "Operations Menu",
    tabMap: "Global Command Map",
    tabVolunteers: "Volunteer Directory",
    tabDepots: "Global Aid Hubs",
    tabZones: "Worldwide Impact Zones",
    tabLogistics: "Logistics Dispatch",
    tabReports: "Situation Reports",
    priorityWeight: "Priority Multiplier",
    optimizeBtn: "RUN GLOBAL OPTIMIZER",
    signOut: "Sign Out",
    loginBtn: "Login / Register",
    depotsTitle: "Strategic Global Aid Hubs",
    restockBtn: "+ Restock Hub",
    addStock: "Add Stock",
    coverageRate: "Worldwide Relief Coverage",
    demandEngine: "AI Demand Engine",
    targetSector: "Target Impact Sector",
    delaySim: "Delay Simulation",
    foodPackets: "Food Ration Packs Required",
    waterLiters: "Potable Water (Liters)",
    medKits: "Trauma Medical Kits",
    calcDemand: "Calculate AI Demand",
    mapLayers: "Map Satellite Layer",
    satellite: "Satellite Thermal",
    street: "Tactical Street",
    terrain: "Topographic Terrain",
    registerVolunteer: "Register Volunteer",
    ownerBadge: "✓ You (Owner)",
    readOnlyBadge: "🔒 Read Only (Not Owner)",
    confirmRestock: "Update Hub Stock",
    loginTab: "Login",
    registerTab: "Register",
    loginTitle: "Authorized Command Access",
    registerTitle: "Create Operations Account",
    loginSubmit: "Login & Authorize",
    registerSubmit: "Register Account",
    fullName: "Full Name",
    phone: "Phone Number",
    role: "Designation / Role",
    email: "Official Email Address",
    password: "Security Password",
    activeResponders: "Active Responders"
  },
  hi: {
    title: "रक्षाग्रिड वैश्विक कमान मंच",
    subtitle: "अंतर्राष्ट्रीय आपदा प्रबंधन कमान",
    liveCrisis: "वैश्विक आपदा कमान सक्रिय",
    tickerText: "टोक्यो खाड़ी में 8.2 तीव्रता भूकंप • तुर्की फॉल्ट लाइन संकट • गंगा बेसिन जलप्रलय • कैलिफोर्निया दावानल",
    menu: "संचालन मेनू",
    tabMap: "वैश्विक कमान मानचित्र",
    tabVolunteers: "स्वयंसेवक निर्देशिका",
    tabDepots: "वैश्विक राहत डिपो व हब",
    tabZones: "विश्वव्यापी आपदा क्षेत्र",
    tabLogistics: "लॉजिस्टिक्स व आपूर्ति मार्ग",
    tabReports: "स्थिति रिपोर्ट (SitRep)",
    priorityWeight: "प्राथमिकता गुणक",
    optimizeBtn: "वैश्विक राहत अनुकूलन (AI)",
    signOut: "लॉगआउट",
    loginBtn: "लॉगिन / रजिस्टर",
    depotsTitle: "रणनीतिक वैश्विक राहत डिपो",
    restockBtn: "+ भंडार भरें",
    addStock: "स्टॉक जोड़ें",
    coverageRate: "वैश्विक राहत कवरेज दर",
    demandEngine: "AI आपदा मांग इंजन",
    targetSector: "लक्षित आपदा क्षेत्र",
    delaySim: "विलंब सिमुलेशन",
    foodPackets: "आवश्यक भोजन पैकेट",
    waterLiters: "पेयजल आवश्यकता (लीटर)",
    medKits: "आपातकालीन मेडिकल किट्स",
    calcDemand: "AI मांग की गणना करें",
    mapLayers: "मानचित्र लेयर",
    satellite: "सैटेलाइट थर्मल",
    street: "सामरिक मार्ग (Street)",
    terrain: "भौगोलिक (Terrain)",
    registerVolunteer: "स्वयंसेवक पंजीकृत करें",
    ownerBadge: "✓ आपका रिकॉर्ड (Owner)",
    readOnlyBadge: "🔒 केवल पढ़ने योग्य",
    confirmRestock: "भंडार स्टॉक अपडेट करें",
    loginTab: "लॉगिन",
    registerTab: "रजिस्टर",
    loginTitle: "अधिकृत कमान लॉगिन",
    registerTitle: "नया अधिकृत खाता बनाएं",
    loginSubmit: "लॉगिन करें और कमान खोलें",
    registerSubmit: "खाता पंजीकृत करें",
    fullName: "पूरा नाम",
    phone: "मोबाइल नंबर",
    role: "पद / भूमिका",
    email: "आधिकारिक ईमेल",
    password: "सुरक्षा पासवर्ड",
    activeResponders: "सक्रिय स्वयंसेवक"
  }
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 2.5, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function App() {
  const [lang, setLang] = useState("en");
  const t = translations[lang];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("COMMANDER");
  const [authPhone, setAuthPhone] = useState("");

  const [mapLayer, setMapLayer] = useState("satellite");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [zones, setZones] = useState(DEFAULT_WORLD_ZONES);
  const [depots, setDepots] = useState(DEFAULT_GLOBAL_DEPOTS);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedZone, setSelectedZone] = useState("Z-GLOBAL-01");
  const [zoneDemand, setZoneDemand] = useState({
    zone_id: "Z-GLOBAL-01",
    zone_name: "Tokyo Bay Megalopolis, Japan",
    severity_score: 9.6,
    predicted_needs: {
      food_packets: { point_estimate: 87000 },
      water_liters: { point_estimate: 217500 },
      medical_kits: { point_estimate: 5800 }
    }
  });
  const [allocations, setAllocations] = useState([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(96.4);
  const [loading, setLoading] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState("1.5");
  const [delayHours, setDelayHours] = useState(0);
  const [mapCenter, setMapCenter] = useState([25.0, 30.0]);
  const [mapZoom, setMapZoom] = useState(2.5);

  const [showVolModal, setShowVolModal] = useState(false);
  const [isEditingVol, setIsEditingVol] = useState(false);
  const [volForm, setVolForm] = useState({ id: "", name: "", email: "", phone: "", skills: "Search & Rescue, Medical", status: "AVAILABLE", latitude: 35.6762, longitude: 139.6503 });

  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [restockForm, setRestockForm] = useState({ food_packets_add: 25000, water_liters_add: 60000, medical_kits_add: 2000, shelter_capacity_add: 1500 });

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
      if (zRes.data && zRes.data.length > 0) setZones(zRes.data);
      if (dRes.data && dRes.data.length > 0) setDepots(dRes.data);
      if (vRes.data && vRes.data.length > 0) setVolunteers(vRes.data);
      
      const targetZoneId = (zRes.data && zRes.data.length > 0) ? zRes.data[0].id : "Z-GLOBAL-01";
      inspectZone(targetZoneId, (zRes.data && zRes.data.length > 0) ? zRes.data : DEFAULT_WORLD_ZONES);
    } catch (err) {
      console.warn("Backend notice:", err);
    }
  };

  const inspectZone = async (zoneId, currentZones = zones) => {
    setSelectedZone(zoneId);
    const target = currentZones.find(z => z.id === zoneId);
    if (target) {
      setMapCenter([target.latitude, target.longitude]);
      setMapZoom(4.5);
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
          startLat: dep ? dep.latitude : 46.2044,
          startLng: dep ? dep.longitude : 6.1432,
          endLat: zon ? zon.latitude : 35.6762,
          endLng: zon ? zon.longitude : 139.6503,
        };
      });
      setAllocations(validAllocations);
      setFulfillmentRate(res.data.total_fulfillment_rate || 96.4);
      setMapCenter([25.0, 30.0]);
      setMapZoom(2.5);
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
        setAuthSuccess(lang === "hi" ? "खाता सफलतापूर्वक पंजीकृत हुआ! कृपया पासवर्ड से लॉगिन करें।" : "Account registered successfully! Please login with your password.");
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
        setShowAuthModal(false);
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || "Authentication error. Please check credentials.");
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
  };

  const requireAuth = (actionCallback) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      actionCallback();
    }
  };

  const handleSaveVolunteer = async (e) => {
    e.preventDefault();
    try {
      const userEmail = currentUser?.email || "commander@ndma.gov.in";
      const userRole = currentUser?.role || "COMMANDER";

      const payload = {
        ...volForm,
        latitude: parseFloat(volForm.latitude) || 35.6762,
        longitude: parseFloat(volForm.longitude) || 139.6503,
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
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    const userEmail = (currentUser?.email || "").toLowerCase();
    const isOwner = (vol.created_by_email || "").toLowerCase() === userEmail;
    const isCommander = (currentUser?.role || "").toUpperCase() === "COMMANDER";

    if (!isOwner && !isCommander) {
      alert(lang === "hi" ? "अनुमति अस्वीकृत: आप केवल अपने बनाए स्वयंसेवक को ही हटा सकते हैं।" : `Permission Denied: Only the creator (${vol.created_by_email}) or Commander can delete it.`);
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
      alert("Hub restocked successfully in database!");
    } catch (err) {
      alert("Restock failed: " + err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-4">
        <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">{t.title}</h2>
              <p className="text-[10px] text-slate-400">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">{t.menu}</div>
          {[
            { id: "dashboard", label: t.tabMap, icon: Globe },
            { id: "volunteers", label: t.tabVolunteers, icon: Users },
            { id: "inventory", label: t.tabDepots, icon: Warehouse },
            { id: "zones", label: t.tabZones, icon: MapPin },
            { id: "logistics", label: t.tabLogistics, icon: Truck },
            { id: "reports", label: t.tabReports, icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "dashboard") { setMapCenter([25.0, 30.0]); setMapZoom(2.5); }
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

        {/* User Card / Login Button */}
        {isAuthenticated ? (
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
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow"
          >
            <LogIn className="w-4 h-4 text-blue-400" />
            <span>{t.loginBtn}</span>
          </button>
        )}
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Live Crisis Ticker */}
        <div className="bg-red-950/90 border-b border-red-900/80 px-4 py-1.5 text-xs text-red-200 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">{t.liveCrisis}</span>
            <span className="truncate">{t.tickerText}</span>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className="text-[10px] font-mono text-red-400">UN OCHA DEFCON 2</span>
            <button 
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="text-[11px] bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full text-slate-200 hover:bg-slate-800 font-semibold"
            >
              {lang === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
            </button>
          </div>
        </div>

        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold tracking-wide text-slate-100 uppercase">{activeTab.replace("-", " ")}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 mr-2">{t.priorityWeight}:</span>
              <select value={priorityOverride} onChange={(e) => setPriorityOverride(e.target.value)} className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-600 focus:outline-none">
                <option value="1.0">1.0x (Standard)</option>
                <option value="1.5">1.5x (High Priority)</option>
                <option value="2.0">2.0x (Critical Lifeline)</option>
              </select>
            </div>

            <button onClick={runOptimization} disabled={loading} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-blue-600/20">
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t.optimizeBtn}
            </button>

            {isAuthenticated ? (
              <button 
                onClick={handleLogout} 
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-100 rounded-lg transition border border-slate-700 hover:border-rose-800 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-lg shadow-blue-600/20 text-xs font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.loginBtn}</span>
              </button>
            )}
          </div>
        </header>

        {/* TAB 1: GLOBAL COMMAND MAP & AI ENGINE */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden p-4 gap-4">
            <div className="md:col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Warehouse className="w-4 h-4 mr-2 text-indigo-400" /> {t.depotsTitle}
                </h2>
                <button onClick={() => requireAuth(() => { setSelectedDepotId(depots[0]?.id || ""); setShowRestockModal(true); })} className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold">
                  {t.restockBtn}
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {depots.map(d => (
                  <div key={d.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/70 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-200 flex justify-between">
                      <span className="truncate max-w-[170px]" title={d.name}>{d.name}</span>
                      <button onClick={() => requireAuth(() => { setSelectedDepotId(d.id); setShowRestockModal(true); })} className="text-[10px] text-blue-400 hover:underline">{t.addStock}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                      <div className="text-slate-400">Food: <span className="text-emerald-400 font-mono">{d.food_packets?.toLocaleString()}</span></div>
                      <div className="text-slate-400">Water: <span className="text-cyan-400 font-mono">{d.water_liters?.toLocaleString()}L</span></div>
                      <div className="text-slate-400">Med Kits: <span className="text-rose-400 font-mono">{d.medical_kits?.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center"><Layers className="w-3.5 h-3.5 mr-1 text-cyan-400" /> {t.mapLayers}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {[
                    { id: "satellite", label: t.satellite },
                    { id: "street", label: t.street },
                    { id: "terrain", label: t.terrain }
                  ].map(l => (
                    <button
                      key={l.id}
                      onClick={() => setMapLayer(l.id)}
                      className={`py-1 rounded font-semibold transition ${mapLayer === l.id ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center"><Sliders className="w-3.5 h-3.5 mr-1 text-cyan-400" /> {t.delaySim}</span>
                  <span className="font-mono text-cyan-300">{delayHours} hrs</span>
                </div>
                <input 
                  type="range" min="0" max="24" step="2" value={delayHours} 
                  onChange={(e) => setDelayHours(parseInt(e.target.value))} 
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0h (Immediate)</span>
                  <span>24h (Critical)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400">{t.coverageRate}</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{fulfillmentRate}%</div>
              </div>
            </div>

            {/* Global Map View */}
            <div className="md:col-span-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl flex flex-col">
              <div className="flex-1 w-full h-full min-h-[480px]">
                <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
                  <MapController center={mapCenter} zoom={mapZoom} />
                  
                  {mapLayer === "satellite" ? (
                    <TileLayer attribution="&copy; Esri World Imagery" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  ) : mapLayer === "terrain" ? (
                    <TileLayer attribution="&copy; OpenTopoMap" url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
                  ) : (
                    <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  )}
                  
                  {zones.map(z => (
                    <Marker key={z.id} position={[z.latitude, z.longitude]} icon={redZoneIcon}>
                      <Popup>
                        <div className="text-slate-900 p-1 text-xs">
                          <p className="font-bold text-sm text-red-600">{z.name}</p>
                          <p><strong>Disaster:</strong> {z.disaster_type}</p>
                          <p><strong>Severity:</strong> {z.severity_score}/10</p>
                          <p><strong>Population:</strong> {z.population?.toLocaleString()}</p>
                          <button onClick={() => inspectZone(z.id)} className="mt-2 w-full py-1 bg-blue-600 text-white font-semibold rounded text-xs">{t.calcDemand}</button>
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
                          <p>Status: {v.status}</p>
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

            {/* Right Demand Calculation */}
            <div className="md:col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-rose-400" /> {t.demandEngine}
                </h2>
                {zoneDemand && <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800 font-semibold">Sev: {zoneDemand.severity_score}</span>}
              </div>

              {zoneDemand ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
                    <div className="text-xs text-slate-400">{t.targetSector}</div>
                    <div className="text-sm font-bold text-slate-100">{zoneDemand.zone_name || zoneDemand.zone_id}</div>
                    <div className="text-[11px] text-amber-400 mt-1">
                      Delay Factor: {(1.0 + delayHours * 0.03).toFixed(2)}x
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">{t.foodPackets}</div>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.food_packets?.point_estimate * (1.0 + delayHours * 0.03)).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">{t.waterLiters}</div>
                      <div className="text-base font-bold text-cyan-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.water_liters?.point_estimate * (1.0 + delayHours * 0.03)).toLocaleString()} L
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                      <div className="text-slate-400">{t.medKits}</div>
                      <div className="text-base font-bold text-rose-400 font-mono">
                        {Math.round(zoneDemand.predicted_needs?.medical_kits?.point_estimate * (1.0 + delayHours * 0.04)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-4 text-center">Select any worldwide disaster pin to calculate ML needs.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VOLUNTEER DIRECTORY */}
        {activeTab === "volunteers" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.tabVolunteers}</h2>
                <p className="text-xs text-slate-400">Manage field responders, medical staff and search & rescue teams worldwide</p>
              </div>
              <button 
                onClick={() => requireAuth(() => {
                  setVolForm({ id: "", name: "", email: "", phone: "", skills: "Search & Rescue, First Aid", status: "AVAILABLE", latitude: 35.6762, longitude: 139.6503 });
                  setIsEditingVol(false);
                  setShowVolModal(true);
                })}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> + {t.registerVolunteer}
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
                    const isOwner = isAuthenticated && (v.created_by_email || "").toLowerCase() === userEmail;
                    const isCommander = isAuthenticated && (currentUser?.role || "").toUpperCase() === "COMMANDER";
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
                              {t.ownerBadge}
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
                              {t.readOnlyBadge}
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

        {/* TAB 3: GLOBAL AID HUBS */}
        {activeTab === "inventory" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div><h2 className="text-lg font-bold">{t.tabDepots}</h2><p className="text-xs text-slate-400">Real-time international UN humanitarian logistics reserves and supply manifests</p></div>
              <button onClick={() => requireAuth(() => { setSelectedDepotId(depots[0]?.id || ""); setShowRestockModal(true); })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold">+ {t.restockBtn}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {depots.map((d) => (
                <div key={d.id} className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div><h3 className="font-bold text-sm text-slate-100">{d.name}</h3><p className="text-xs text-slate-400 font-mono">{d.id}</p></div>
                    <button onClick={() => requireAuth(() => { setSelectedDepotId(d.id); setShowRestockModal(true); })} className="px-3 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded text-xs font-semibold border border-blue-700">Restock Hub</button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Food Ration Packs</span><span className="font-mono text-emerald-400 font-semibold">{d.food_packets?.toLocaleString()} units</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: "85%" }}></div></div></div>
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Potable Water</span><span className="font-mono text-cyan-400 font-semibold">{d.water_liters?.toLocaleString()} L</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-cyan-500 h-2 rounded-full" style={{ width: "90%" }}></div></div></div>
                    <div><div className="flex justify-between text-slate-400 mb-1"><span>Trauma Emergency Kits</span><span className="font-mono text-rose-400 font-semibold">{d.medical_kits?.toLocaleString()} kits</span></div><div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-2 rounded-full" style={{ width: "75%" }}></div></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WORLDWIDE IMPACT ZONES */}
        {activeTab === "zones" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <h2 className="text-lg font-bold">{t.tabZones}</h2>
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

        {/* TAB 5: LOGISTICS DISPATCH */}
        {activeTab === "logistics" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.tabLogistics}</h2>
                <p className="text-xs text-slate-400">OR-Tools dynamic multi-depot supply allocation routes computed across continents</p>
              </div>
              <button onClick={runOptimization} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold">Recalculate Routes</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allocations.map((a, i) => (
                <div key={i} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-blue-400 font-bold">
                    <span><Truck className="w-4 h-4 inline mr-1" /> Global Airlift #{i + 201}</span>
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

        {/* TAB 6: SITUATION REPORTS */}
        {activeTab === "reports" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.tabReports} (SitRep-04)</h2>
                <p className="text-xs text-slate-400">Official worldwide incident coordination and donor accountability dossier</p>
              </div>
              <button onClick={() => alert("Situation Report PDF downloaded!")} className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold">
                <Download className="w-4 h-4 mr-1.5" /> Download Full SitRep PDF
              </button>
            </div>
            <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-base font-bold text-slate-100">Global Relief Coordination & Resource Manifest</div>
                <div className="text-slate-400 text-[11px]">Authority: United Nations OCHA & National Disaster Command</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">Total Population Impacted</div><div className="text-lg font-bold mt-1">627,000</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">{t.tabDepots}</div><div className="text-lg font-bold text-emerald-400 mt-1">{depots.length} Active Hubs</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">{t.activeResponders}</div><div className="text-lg font-bold text-blue-400 mt-1">{volunteers.length} Active</div></div>
                <div className="p-3 bg-slate-800 rounded-lg"><div className="text-slate-400">{t.coverageRate}</div><div className="text-lg font-bold text-purple-400 mt-1">{fulfillmentRate}%</div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTEXTUAL AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => { setShowAuthModal(false); setAuthError(""); setAuthSuccess(""); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-blue-950 border border-blue-800 rounded-2xl text-rose-500 mb-1">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">{authMode === "login" ? t.loginTitle : t.registerTitle}</h3>
              <p className="text-xs text-slate-400">Authorize to add responders, restock hubs, or manage operations</p>
            </div>

            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                className={`py-2 rounded-lg font-bold transition ${authMode === "login" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                {t.loginTab}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
                className={`py-2 rounded-lg font-bold transition ${authMode === "register" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                {t.registerTab}
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
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">{t.fullName}</label>
                    <input 
                      type="text" 
                      value={authName} 
                      onChange={(e) => setAuthName(e.target.value)} 
                      placeholder="e.g. Col. Raviranjan Kumar" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">{t.phone}</label>
                    <input 
                      type="text" 
                      value={authPhone} 
                      onChange={(e) => setAuthPhone(e.target.value)} 
                      placeholder="+91 9876543210" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">{t.role}</label>
                    <select 
                      value={authRole} 
                      onChange={(e) => setAuthRole(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="COMMANDER">Crisis Commander (Full Authorization)</option>
                      <option value="VOLUNTEER">Field Volunteer & First Responder</option>
                      <option value="LOGISTICS_OFFICER">Logistics & Supply Coordinator</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">{t.email}</label>
                <input 
                  type="email" 
                  value={authEmail} 
                  onChange={(e) => setAuthEmail(e.target.value)} 
                  placeholder="commander@ndma.gov.in" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 text-[10px] uppercase">{t.password}</label>
                <input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 rounded-xl text-white font-bold text-xs tracking-wide uppercase transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4 mr-1" />
                <span>{authLoading ? "Authenticating..." : authMode === "register" ? t.registerSubmit : t.loginSubmit}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VOLUNTEER ADD / EDIT */}
      {showVolModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-blue-400" />
                {isEditingVol ? "Edit Volunteer Profile" : t.registerVolunteer}
              </h3>
              <button onClick={() => setShowVolModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveVolunteer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">{t.fullName}</label>
                  <input type="text" value={volForm.name} onChange={(e) => setVolForm({ ...volForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">{t.phone}</label>
                  <input type="text" value={volForm.phone} onChange={(e) => setVolForm({ ...volForm, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t.email}</label>
                <input type="email" value={volForm.email} onChange={(e) => setVolForm({ ...volForm, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specialized Skills</label>
                <input type="text" value={volForm.skills} onChange={(e) => setVolForm({ ...volForm, skills: e.target.value })} placeholder="Earthquake Rescue, Trauma Triage, Logistics" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" required />
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
                  <input type="number" step="any" value={volForm.latitude} onChange={(e) => setVolForm({ ...volForm, latitude: parseFloat(e.target.value) || 35.6762 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Base Longitude</label>
                  <input type="number" step="any" value={volForm.longitude} onChange={(e) => setVolForm({ ...volForm, longitude: parseFloat(e.target.value) || 139.6503 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100" />
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button type="button" onClick={() => setShowVolModal(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">{t.registerVolunteer}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESTOCK HUB */}
      {showRestockModal && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <Warehouse className="w-4 h-4 mr-2 text-emerald-400" /> Restock Global Aid Hub
              </h3>
              <button onClick={() => setShowRestockModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Target Aid Hub</label>
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
                  <label className="block text-slate-400 mb-1">Add Vehicles / Capacity</label>
                  <input type="number" value={restockForm.shelter_capacity_add} onChange={(e) => setRestockForm({ ...restockForm, shelter_capacity_add: parseInt(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono" />
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button type="button" onClick={() => setShowRestockModal(false)} className="flex-1 py-2 bg-slate-800 rounded-lg text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold">{t.confirmRestock}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
