import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ShieldAlert, Truck, Box, Activity, RefreshCw } from "lucide-react";
import axios from "axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_BASE = "http://localhost:8000/api/v1";

export default function App() {
  const [zones, setZones] = useState([]);
  const [depots, setDepots] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDemand, setZoneDemand] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState("1.0");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [zRes, dRes] = await Promise.all([
        axios.get(`${API_BASE}/zones`),
        axios.get(`${API_BASE}/depots`)
      ]);
      setZones(zRes.data);
      setDepots(dRes.data);
      if (zRes.data.length > 0) {
        inspectZone(zRes.data[0].id);
      }
    } catch (err) {
      console.warn("Using sample mock data (backend offline):", err);
      const fallbackZones = [
        { id: "Z-01", name: "Riverside Sector North", severity_score: 8.8, population: 14500, latitude: 25.5941, longitude: 85.1376 },
        { id: "Z-02", name: "East Bypass Zone", severity_score: 6.4, population: 8200, latitude: 25.6050, longitude: 85.1820 },
        { id: "Z-03", name: "Old Industrial District", severity_score: 9.2, population: 19800, latitude: 25.6210, longitude: 85.1150 }
      ];
      const fallbackDepots = [
        { id: "DEPOT-ALPHA", name: "Central Military Depot", food_packets: 35000, water_liters: 95000, medical_kits: 1800, latitude: 25.5720, longitude: 85.0950 }
      ];
      setZones(fallbackZones);
      setDepots(fallbackDepots);
    }
  };

  const inspectZone = async (zoneId) => {
    setSelectedZone(zoneId);
    try {
      const res = await axios.get(`${API_BASE}/predict/demand/${zoneId}`);
      setZoneDemand(res.data);
    } catch (err) {
      console.error("Demand prediction fetch error", err);
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
      setAllocations(res.data.allocations);
      setFulfillmentRate(res.data.total_fulfillment_rate);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-7 h-7 text-rose-500 animate-pulse" />
          <div>
            <h1 className="text-lg font-bold tracking-wide">Disaster Operations Command Platform (DOCP)</h1>
            <p className="text-xs text-slate-400">AI-Powered Resource Allocation & Neon PostgreSQL</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 mr-2">Priority Override:</span>
            <select 
              value={priorityOverride} 
              onChange={(e) => setPriorityOverride(e.target.value)}
              className="bg-slate-900 text-slate-200 rounded px-2 py-0.5 border border-slate-600 focus:outline-none"
            >
              <option value="1.0">1.0x (Standard)</option>
              <option value="1.5">1.5x (High Priority)</option>
              <option value="2.0">2.0x (Critical Lifeline)</option>
            </select>
          </div>
          <button 
            onClick={runOptimization}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-blue-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
            RUN OR-TOOLS OPTIMIZER
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 flex-1 overflow-hidden p-4 gap-4">
        <div className="col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Box className="w-4 h-4 mr-2 text-indigo-400" /> Resource Depots
            </h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800">
              {depots.length} Active
            </span>
          </div>

          <div className="overflow-y-auto space-y-3 flex-1 pr-1">
            {depots.map(d => (
              <div key={d.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/70 text-xs space-y-1.5 hover:border-slate-600 transition">
                <div className="font-semibold text-slate-200 flex justify-between">
                  <span>{d.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{d.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                  <div className="text-slate-400">Food: <span className="text-emerald-400 font-mono">{d.food_packets.toLocaleString()}</span></div>
                  <div className="text-slate-400">Water: <span className="text-cyan-400 font-mono">{d.water_liters.toLocaleString()}L</span></div>
                  <div className="text-slate-400">Med Kits: <span className="text-rose-400 font-mono">{d.medical_kits}</span></div>
                  <div className="text-slate-400">Vehicles: <span className="text-amber-400 font-mono">{d.available_vehicles || 10}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400">Overall Coverage Rate</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{fulfillmentRate}%</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${fulfillmentRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="col-span-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shadow-2xl">
          <MapContainer center={[25.5941, 85.1376]} zoom={12} className="h-full w-full">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {zones.map(z => (
              <Marker key={z.id} position={[z.latitude, z.longitude]}>
                <Popup>
                  <div className="text-slate-900 font-sans p-1 text-xs">
                    <p className="font-bold text-sm">{z.name}</p>
                    <p className="text-rose-600 font-semibold">Severity: {z.severity_score}/10</p>
                    <p>Pop: {z.population?.toLocaleString()}</p>
                    <button 
                      onClick={() => inspectZone(z.id)} 
                      className="mt-2 w-full py-1 bg-blue-600 text-white font-semibold rounded"
                    >
                      Inspect AI Demand
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {depots.map(d => (
              <Marker key={d.id} position={[d.latitude, d.longitude]}>
                <Popup>
                  <div className="text-slate-900 font-sans p-1 text-xs">
                    <p className="font-bold">{d.name}</p>
                    <p className="text-emerald-600 font-semibold">Depot Supply Active</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {allocations.map((alloc, idx) => (
              <Polyline 
                key={idx} 
                positions={[
                  [alloc.route.coordinates[0][1], alloc.route.coordinates[0][0]],
                  [alloc.route.coordinates[1][1], alloc.route.coordinates[1][0]]
                ]}
                color="#38bdf8"
                weight={3}
                dashArray="6, 8"
              />
            ))}
          </MapContainer>
        </div>

        <div className="col-span-3 bg-slate-900/90 rounded-xl p-4 flex flex-col border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-rose-400" /> AI Demand Engine
            </h2>
            {zoneDemand && (
              <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800">
                Sev: {zoneDemand.severity_score}
              </span>
            )}
          </div>

          {zoneDemand ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80">
                <div className="text-xs text-slate-400">Target Zone</div>
                <div className="text-sm font-bold text-slate-100">{zoneDemand.zone_name || zoneDemand.zone_id}</div>
                <div className="text-[11px] text-amber-400 mt-0.5">Vulnerability Multiplier: {zoneDemand.vulnerability_index}x</div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
                  <div className="text-slate-400">Food Ration Packs</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {zoneDemand.predicted_needs.food_packets.point_estimate.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    95% CI: [{zoneDemand.predicted_needs.food_packets.ci_lower} - {zoneDemand.predicted_needs.food_packets.ci_upper}]
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
                  <div className="text-slate-400">Potable Water (Liters)</div>
                  <div className="text-base font-bold text-cyan-400 font-mono">
                    {zoneDemand.predicted_needs.water_liters.point_estimate.toLocaleString()} L
                  </div>
                  <div className="text-[10px] text-slate-500">
                    95% CI: [{zoneDemand.predicted_needs.water_liters.ci_lower} - {zoneDemand.predicted_needs.water_liters.ci_upper}]
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
                  <div className="text-slate-400">Trauma Medical Kits</div>
                  <div className="text-base font-bold text-rose-400 font-mono">
                    {zoneDemand.predicted_needs.medical_kits.point_estimate.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    95% CI: [{zoneDemand.predicted_needs.medical_kits.ci_lower} - {zoneDemand.predicted_needs.medical_kits.ci_upper}]
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
                  <div className="text-slate-400">Shelter Accommodations</div>
                  <div className="text-base font-bold text-purple-400 font-mono">
                    {zoneDemand.predicted_needs.shelter_capacity.point_estimate.toLocaleString()} Persons
                  </div>
                  <div className="text-[10px] text-slate-500">
                    95% CI: [{zoneDemand.predicted_needs.shelter_capacity.ci_lower} - {zoneDemand.predicted_needs.shelter_capacity.ci_upper}]
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-4 text-center">
              Click a sector marker on the map to load ML demand calculations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
