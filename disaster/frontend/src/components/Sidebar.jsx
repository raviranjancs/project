import React from "react";
import { LayoutDashboard, MapPin, Warehouse, Truck, FileText, Settings, ShieldAlert } from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
    { id: "zones", label: "Disaster Zones", icon: MapPin },
    { id: "inventory", label: "Depots & Stocks", icon: Warehouse },
    { id: "logistics", label: "Logistics Dispatch", icon: Truck },
    { id: "reports", label: "Situation Reports", icon: FileText }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-4">
      <div className="flex items-center space-x-3 px-2 py-2 border-b border-slate-800">
        <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
        <div>
          <h2 className="text-sm font-bold text-slate-100">DOCP Command</h2>
          <p className="text-[10px] text-slate-400">Disaster Management AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
        <div className="text-[10px] text-slate-400 font-semibold uppercase">Engine Status</div>
        <div className="flex items-center space-x-2 mt-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-400 font-medium">Neon DB Connected</span>
        </div>
      </div>
    </aside>
  );
}
