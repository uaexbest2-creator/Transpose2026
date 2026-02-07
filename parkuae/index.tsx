
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Car, 
  User, 
  Briefcase, 
  Clock, 
  MapPin, 
  CreditCard, 
  Bell, 
  History, 
  Users, 
  Plus, 
  ChevronRight, 
  Search, 
  Settings, 
  LogOut, 
  Zap, 
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Types ---

type Role = 'customer' | 'business' | null;

interface ParkingSession {
  id: string;
  location: string;
  startTime: string;
  endTime?: string;
  cost: number;
  status: 'active' | 'completed' | 'expired';
  zone: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  emirate: string;
}

interface Driver {
  id: string;
  name: string;
  status: 'active' | 'idle';
  totalSpent: number;
  currentVehicleId?: string;
}

interface BusinessReport {
  totalCost: number;
  totalSessions: number;
  activeDrivers: number;
  peakZone: string;
}

// --- Mock Data ---

const INITIAL_CUSTOMER_HISTORY: ParkingSession[] = [
  { id: '1', location: 'Dubai Mall - P3', startTime: '2023-11-20T10:00:00', endTime: '2023-11-20T12:00:00', cost: 10, status: 'completed', zone: '365B' },
  { id: '2', location: 'JBR Walk', startTime: '2023-11-19T18:30:00', endTime: '2023-11-19T20:30:00', cost: 20, status: 'completed', zone: '382C' },
  { id: '3', location: 'Business Bay', startTime: '2023-11-18T09:00:00', endTime: '2023-11-18T17:00:00', cost: 45, status: 'completed', zone: '322A' },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Ahmed Khalid', status: 'active', totalSpent: 1250, currentVehicleId: 'v1' },
  { id: 'd2', name: 'Sarah Al-Mansoori', status: 'idle', totalSpent: 890 },
  { id: 'd3', name: 'Omar Hassan', status: 'active', totalSpent: 2100, currentVehicleId: 'v2' },
];

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'A 12345', model: 'Toyota Hiace', emirate: 'Dubai' },
  { id: 'v2', plate: 'B 99821', model: 'Nissan Urvan', emirate: 'Abu Dhabi' },
  { id: 'v3', plate: 'C 44510', model: 'Tesla Model 3', emirate: 'Dubai' },
];

// --- Components ---

const Header = ({ role, onLogout, title }: { role: Role, onLogout: () => void, title: string }) => (
  <header className="sticky top-0 z-50 bg-indigo-950 text-white p-4 shadow-lg flex justify-between items-center">
    <div className="flex items-center gap-2">
      <div className="bg-amber-400 p-2 rounded-lg">
        <Car className="text-indigo-950" size={20} />
      </div>
      <h1 className="font-bold text-lg tracking-tight">PARK<span className="text-amber-400">UAE</span></h1>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-xs bg-indigo-900 px-2 py-1 rounded-full uppercase tracking-widest opacity-80 border border-indigo-800">
        {role}
      </span>
      <button onClick={onLogout} className="p-1 hover:text-amber-400 transition-colors">
        <LogOut size={20} />
      </button>
    </div>
  </header>
);

const App = () => {
  const [role, setRole] = useState<Role>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isParked, setIsParked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [customerHistory, setCustomerHistory] = useState(INITIAL_CUSTOMER_HISTORY);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [currentSession, setCurrentSession] = useState<ParkingSession | null>(null);

  // --- AI Interactions ---

  const getAiInsight = async (mode: 'customer' | 'business') => {
    setLoading(true);
    try {
      const prompt = mode === 'customer' 
        ? "Analyze these UAE parking sessions and suggest 3 smart tips or patterns for the user (e.g., best times to avoid fines, loyalty perks): " + JSON.stringify(customerHistory)
        : "Act as a UAE fleet manager. Analyze this data and give 2 strategic improvements for reducing parking costs for a business: " + JSON.stringify({ drivers, vehicles });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });
      setAiSuggestion(response.text || "No insights available right now.");
    } catch (error) {
      console.error(error);
      setAiSuggestion("Could not load AI insights. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) getAiInsight(role);
  }, [role]);

  // --- Simulation Logic ---

  const toggleParking = () => {
    if (!isParked) {
      const newSession: ParkingSession = {
        id: Math.random().toString(36).substr(2, 9),
        location: 'Current Location (GPS)',
        startTime: new Date().toISOString(),
        cost: 4,
        status: 'active',
        zone: 'Dubai 332C'
      };
      setCurrentSession(newSession);
      setIsParked(true);
    } else {
      if (currentSession) {
        const completed = { ...currentSession, endTime: new Date().toISOString(), status: 'completed' as const };
        setCustomerHistory([completed, ...customerHistory]);
      }
      setIsParked(false);
      setCurrentSession(null);
    }
  };

  // --- Views ---

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm" />
        
        <div className="relative z-10 text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block bg-amber-400 p-4 rounded-3xl mb-4 shadow-2xl">
            <Car size={48} className="text-indigo-950" />
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">PARK<span className="text-amber-400">UAE</span></h1>
          <p className="text-indigo-200 text-lg">Smart Parking & Fleet Management</p>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-4">
          <button 
            onClick={() => setRole('customer')}
            className="w-full bg-white hover:bg-slate-50 text-indigo-950 p-6 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] shadow-xl group border-b-4 border-slate-200"
          >
            <div className="bg-indigo-100 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
              <User size={24} className="text-indigo-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">Individual Customer</h3>
              <p className="text-sm text-slate-500">Pay, extend, and track personal parking.</p>
            </div>
            <ChevronRight className="ml-auto text-slate-300" />
          </button>

          <button 
            onClick={() => setRole('business')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] shadow-xl group border-b-4 border-indigo-800"
          >
            <div className="bg-indigo-500 p-3 rounded-xl">
              <Briefcase size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg">Business / Fleet</h3>
              <h4 className="text-xs font-medium text-indigo-300 uppercase tracking-widest mb-1">Corporate Mode</h4>
              <p className="text-sm text-indigo-100">Manage drivers, vehicles, and expense reports.</p>
            </div>
            <ChevronRight className="ml-auto text-indigo-400" />
          </button>
        </div>
        
        <p className="relative z-10 text-indigo-300 mt-12 text-sm opacity-60 italic">Official Parking Partner Simulation</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Header role={role} onLogout={() => setRole(null)} title="Dashboard" />

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        {role === 'customer' ? (
          <>
            {/* Status Section */}
            <section className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className={`absolute top-0 right-0 p-3 ${isParked ? 'text-green-500' : 'text-slate-300'}`}>
                <div className={`w-3 h-3 rounded-full ${isParked ? 'bg-green-500 animate-ping' : 'bg-slate-300'}`} />
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-5 rounded-full ${isParked ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <Car size={40} className={isParked ? 'text-green-600' : 'text-slate-400'} />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {isParked ? 'Parking Active' : 'Not Parked'}
                  </h2>
                  <p className="text-slate-500">
                    {isParked 
                      ? `Zone: ${currentSession?.zone} | Started: ${new Date(currentSession?.startTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                      : 'We will notify you when we detect a stop.'}
                  </p>
                </div>

                <button 
                  onClick={toggleParking}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-md active:scale-95 ${
                    isParked 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isParked ? 'Stop & Pay (AED 4.00)' : 'Start Parking Manually'}
                </button>
              </div>
            </section>

            {/* AI Insights */}
            <section className="bg-amber-50 rounded-3xl p-6 border border-amber-100 space-y-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Zap size={20} className="fill-amber-400 text-amber-400" />
                <h3>Smart Insights (AI)</h3>
              </div>
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-2 bg-amber-200 rounded"></div>
                    <div className="h-2 bg-amber-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-line">
                  {aiSuggestion}
                </p>
              )}
            </section>

            {/* History List */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <History size={20} className="text-slate-400" /> Recent Activity
                </h3>
                <button className="text-indigo-600 text-sm font-semibold">View All</button>
              </div>

              <div className="space-y-3">
                {customerHistory.map(session => (
                  <div key={session.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-500">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{session.location}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Clock size={12} />
                        <span>{new Date(session.startTime).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Zone {session.zone}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600">AED {session.cost.toFixed(2)}</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full inline-block">PAID</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Business Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                <div className="text-indigo-600 bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <TrendingUp size={20} />
                </div>
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Costs</div>
                <div className="text-2xl font-black text-slate-900">AED 4,240</div>
                <div className="text-[10px] text-green-600 font-bold">+12% vs last month</div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                <div className="text-amber-600 bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center mb-2">
                  <Users size={20} />
                </div>
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Drivers</div>
                <div className="text-2xl font-black text-slate-900">12 / 15</div>
                <div className="text-[10px] text-slate-400 font-bold">3 currently idle</div>
              </div>
            </div>

            {/* AI Fleet Analysis */}
            <section className="bg-indigo-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -translate-y-16 translate-x-16 opacity-50" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-400 fill-amber-400" />
                  <h3 className="font-bold uppercase tracking-widest text-xs">Fleet Insight</h3>
                </div>
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-indigo-700 rounded w-full"></div>
                    <div className="h-2 bg-indigo-700 rounded w-3/4"></div>
                  </div>
                ) : (
                  <p className="text-sm text-indigo-100 italic leading-relaxed">
                    "{aiSuggestion}"
                  </p>
                )}
              </div>
            </section>

            {/* Management Tabs */}
            <section className="space-y-4">
              <div className="flex gap-2">
                {['Drivers', 'Vehicles', 'Reports'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      activeTab === tab.toLowerCase() 
                        ? 'bg-amber-400 text-indigo-950 shadow-md' 
                        : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {activeTab === 'drivers' && drivers.map(driver => (
                  <div key={driver.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      <User size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{driver.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${driver.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                        {driver.status === 'active' ? 'Currently on duty' : 'Offline'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">AED {driver.totalSpent}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Parking</div>
                    </div>
                  </div>
                ))}

                {activeTab === 'vehicles' && vehicles.map(vehicle => (
                  <div key={vehicle.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Car size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{vehicle.plate}</h4>
                      <p className="text-xs text-slate-500">{vehicle.model} • {vehicle.emirate}</p>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <Settings size={18} />
                    </button>
                  </div>
                ))}

                {activeTab === 'reports' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">Monthly Expense Report</h4>
                        <p className="text-xs text-slate-500">Nov 1 - Nov 30, 2023</p>
                      </div>
                      <button className="ml-auto bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cost Breakdown by Emirate</h5>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Dubai</span>
                            <span>72%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[72%]" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Abu Dhabi</span>
                            <span>28%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 w-[28%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-50' : ''}`}>
            <History size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">History</span>
        </button>
        
        <div className="relative -mt-10">
          <button className="bg-amber-400 text-indigo-950 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-white active:scale-95 transition-transform hover:rotate-12">
            <CreditCard size={28} />
          </button>
        </div>

        <button className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-indigo-50' : ''}`}>
            <Settings size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </button>
      </nav>

      {/* Mock Notifications Toast (Top) */}
      {isParked && (
        <div className="fixed top-20 left-4 right-4 z-40 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-amber-400 text-indigo-950 p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3">
            <div className="bg-white/30 p-2 rounded-xl">
              <Bell size={18} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider opacity-60">Active Session</p>
              <p className="text-sm font-bold">Parking expires in 12 mins. Extend now?</p>
            </div>
            <button className="bg-indigo-950 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Extend</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
