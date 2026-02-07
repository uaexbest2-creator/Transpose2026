
import React, { useState, useEffect, useRef } from 'react';
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
  Settings, 
  LogOut, 
  Zap, 
  TrendingUp,
  FileText,
  Navigation,
  Receipt,
  CheckCircle2,
  Camera,
  X,
  Scan,
  Info
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Types ---

type Role = 'customer' | 'business-admin' | 'business-driver' | null;
type ScanType = 'plate' | 'sign' | null;

interface ParkingSession {
  id: string;
  location: string;
  startTime: string;
  endTime?: string;
  cost: number;
  status: 'active' | 'completed' | 'expired';
  zone: string;
  driverId?: string;
  driverName?: string;
  vehiclePlate?: string;
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

// --- Utils ---

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Mock Data ---

const INITIAL_CUSTOMER_HISTORY: ParkingSession[] = [
  { id: '1', location: 'Dubai Mall - P3', startTime: '2023-11-20T10:00:00', endTime: '2023-11-20T12:00:00', cost: 10, status: 'completed', zone: '365B' },
  { id: '2', location: 'JBR Walk', startTime: '2023-11-19T18:30:00', endTime: '2023-11-19T20:30:00', cost: 20, status: 'completed', zone: '382C' },
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

const INITIAL_ADMIN_ACTIVITY: ParkingSession[] = [
  { id: 'a1', location: 'DIFC Gate', startTime: '2023-11-21T08:30:00', endTime: '2023-11-21T09:30:00', cost: 10, status: 'completed', zone: '312A', driverName: 'Ahmed Khalid', vehiclePlate: 'A 12345' },
  { id: 'a2', location: 'Business Bay', startTime: '2023-11-21T10:00:00', cost: 4, status: 'active', zone: '332C', driverName: 'Omar Hassan', vehiclePlate: 'B 99821' },
];

// --- Components ---

const Header = ({ role, onLogout }: { role: Role, onLogout: () => void }) => (
  <header className="sticky top-0 z-50 bg-indigo-950 text-white p-4 shadow-lg flex justify-between items-center">
    <div className="flex items-center gap-2">
      <div className="bg-amber-400 p-2 rounded-lg shadow-inner">
        <Car className="text-indigo-950" size={20} />
      </div>
      <h1 className="font-bold text-lg tracking-tight uppercase">PARK<span className="text-amber-400">UAE</span></h1>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest text-indigo-200 border border-white/5 backdrop-blur-md">
        {role?.replace('-', ' ')}
      </span>
      <button onClick={onLogout} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-amber-400">
        <LogOut size={18} />
      </button>
    </div>
  </header>
);

const CameraModal = ({ isOpen, onClose, onCapture, type }: { isOpen: boolean, onClose: () => void, onCapture: (base64: string) => void, type: ScanType }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera access denied:", err));
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const base64 = await blobToBase64(blob);
          onCapture(base64);
          onClose();
        }
      }, 'image/jpeg');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-indigo-500/30">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* UI Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white">
              <X size={24} />
            </button>
            <div className="bg-indigo-600/80 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-widest">
              Detecting {type === 'plate' ? 'Plate' : 'Parking Sign'}
            </div>
            <div className="w-10 h-10" />
          </div>
          
          <div className="flex flex-col items-center gap-8 pointer-events-auto">
            <div className="w-full border-2 border-white/20 rounded-2xl aspect-[4/1] relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 -m-1 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 -m-1 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 -m-1 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 -m-1 rounded-br-lg" />
            </div>
            
            <button 
              onClick={captureImage}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-8 border-white/20 shadow-2xl active:scale-90 transition-transform"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center">
                <Scan size={32} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
      <p className="text-indigo-200 mt-6 text-sm font-bold text-center">
        Center the {type === 'plate' ? 'car plate' : 'parking sign'} in the frame
      </p>
    </div>
  );
};

const App = () => {
  const [role, setRole] = useState<Role>(null);
  const [isParked, setIsParked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [customerHistory, setCustomerHistory] = useState(INITIAL_CUSTOMER_HISTORY);
  const [adminActivity, setAdminActivity] = useState(INITIAL_ADMIN_ACTIVITY);
  const [vehicles] = useState(INITIAL_VEHICLES);
  const [currentSession, setCurrentSession] = useState<ParkingSession | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState(INITIAL_VEHICLES[0]);
  
  // Detection States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeScanType, setActiveScanType] = useState<ScanType>(null);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- AI Interactions ---

  const getAiInsight = async (mode: Role) => {
    if (mode !== 'business-admin') return;
    setLoading(true);
    try {
      const prompt = "As a UAE fleet admin, analyze this driver activity and give 2 strategic improvements for operational efficiency: " + JSON.stringify(adminActivity);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });
      setAiSuggestion(response.text || "No insights available right now.");
    } catch (error) {
      console.error(error);
      setAiSuggestion("AI insights are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'business-admin') getAiInsight(role);
  }, [role]);

  // --- AI Detection Logic ---

  const openScanner = (type: ScanType) => {
    setActiveScanType(type);
    setIsCameraOpen(true);
  };

  const handleCapture = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const prompt = activeScanType === 'plate' 
        ? `I'm providing a photo of a car license plate from the UAE. Please identify the Plate Number and Emirate (e.g., Dubai J 12345). Return ONLY the extracted plate details concisely.`
        : `I'm providing a photo of a parking sign from the UAE. Please identify the Zone Number (e.g., 332C), the Parking Type, and any critical restrictions. Return ONLY the extracted details concisely.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } }
          ]
        }
      });

      const result = response.text || "Could not recognize data.";
      
      if (activeScanType === 'sign') {
        const zoneMatch = result.match(/zone\s*([A-Z0-9]+)/i);
        if (zoneMatch) setDetectedZone(zoneMatch[1].toUpperCase());
        else setDetectedZone('332C'); // Fallback for simulation
      } else {
        const plateMatch = result.match(/(\d{5})/i);
        if (plateMatch) setDetectedPlate(plateMatch[1]);
        else setDetectedPlate('99821'); // Fallback for simulation
      }
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
      setActiveScanType(null);
    }
  };

  // --- Logic ---

  const handleStartParking = () => {
    const newSession: ParkingSession = {
      id: Math.random().toString(36).substr(2, 9),
      location: 'UAE Smart Zone',
      startTime: new Date().toISOString(),
      cost: 4,
      status: 'active',
      zone: detectedZone || '332C',
      driverName: role === 'business-driver' ? 'Ahmed Khalid' : 'Self',
      vehiclePlate: role === 'business-driver' ? selectedVehicle.plate : (detectedPlate || 'Private Plate')
    };
    setCurrentSession(newSession);
    setIsParked(true);
    setDetectedZone(null);
    setDetectedPlate(null);
    
    if (role === 'business-driver') {
      setAdminActivity(prev => [newSession, ...prev]);
    }
  };

  const handleStopParking = () => {
    if (currentSession) {
      const completed: ParkingSession = { ...currentSession, endTime: new Date().toISOString(), status: 'completed' };
      if (role === 'customer') {
        setCustomerHistory(prev => [completed, ...prev]);
      } else if (role === 'business-driver') {
        setAdminActivity(prev => prev.map(s => s.id === completed.id ? completed : s));
      }
    }
    setIsParked(false);
    setCurrentSession(null);
  };

  // --- Views ---

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-sm" />
        <div className="relative z-10 text-center mb-10">
          <div className="inline-block bg-amber-400 p-4 rounded-[2rem] mb-6 shadow-2xl rotate-3">
            <Car size={48} className="text-indigo-950" />
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">PARK<span className="text-amber-400">UAE</span></h1>
          <p className="text-indigo-200/80 font-medium">UAE's Premier Fleet & Parking Ecosystem</p>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-4">
          <button onClick={() => setRole('customer')} className="w-full bg-white text-indigo-950 p-6 rounded-[2rem] flex items-center gap-4 transition-all hover:scale-[1.03] shadow-xl group border-b-4 border-slate-200">
            <div className="bg-indigo-50 p-3.5 rounded-2xl group-hover:bg-amber-100 transition-colors">
              <User size={24} className="text-indigo-600" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-extrabold text-lg">Personal User</h3>
              <p className="text-sm text-slate-500 font-medium">Manage personal parking.</p>
            </div>
            <ChevronRight className="text-slate-300" />
          </button>
          <button onClick={() => setRole('business-admin')} className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] flex items-center gap-4 transition-all hover:scale-[1.03] shadow-xl group border-b-4 border-indigo-800">
            <div className="bg-indigo-500/50 p-3.5 rounded-2xl backdrop-blur-sm">
              <Briefcase size={24} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-extrabold text-lg">Fleet Admin</h3>
              <p className="text-sm text-indigo-100/70 font-medium">Monitoring & Strategic Analysis.</p>
            </div>
            <ChevronRight className="text-indigo-400" />
          </button>
          <button onClick={() => setRole('business-driver')} className="w-full bg-slate-800 text-white p-6 rounded-[2rem] flex items-center gap-4 transition-all hover:scale-[1.03] shadow-xl group border-b-4 border-slate-900">
            <div className="bg-slate-700 p-3.5 rounded-2xl">
              <Navigation size={24} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-extrabold text-lg">Fleet Driver</h3>
              <p className="text-sm text-slate-400 font-medium">Log trips & send receipts.</p>
            </div>
            <ChevronRight className="text-slate-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <Header role={role} onLogout={() => setRole(null)} />
      
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCapture} 
        type={activeScanType}
      />

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        
        {isAnalyzing && (
          <div className="bg-indigo-600 text-white p-4 rounded-3xl flex items-center gap-3 shadow-lg animate-pulse">
            <Zap className="animate-spin text-amber-400" size={20} />
            <p className="font-black text-xs uppercase tracking-widest">AI Analyzing Image...</p>
          </div>
        )}

        {role === 'customer' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => openScanner('plate')} className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Car size={24}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Plate</span>
              </button>
              <button onClick={() => openScanner('sign')} className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><MapPin size={24}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan Sign</span>
              </button>
            </div>

            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center gap-6 relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-full h-1.5 ${isParked ? 'bg-green-500 animate-pulse' : 'bg-slate-100'}`} />
               <div className={`p-6 rounded-[2rem] ${isParked ? 'bg-green-50' : 'bg-slate-50'}`}>
                <Car size={48} className={isParked ? 'text-green-600' : 'text-slate-400'} />
               </div>
               <div>
                 <h2 className="text-3xl font-black text-slate-900">{isParked ? 'Parked' : 'On the road'}</h2>
                 <p className="text-slate-500 font-medium">
                    {isParked 
                      ? `Active in Zone ${currentSession?.zone}` 
                      : (detectedZone ? `Detected Zone ${detectedZone}` : 'Identify your zone to start.')}
                 </p>
               </div>
               
               {detectedPlate && !isParked && (
                 <div className="bg-indigo-50 text-indigo-900 px-4 py-3 rounded-2xl w-full flex items-center justify-between border border-indigo-100">
                    <div className="flex items-center gap-2 font-bold text-sm"><Car size={18} /> Scanned Plate: {detectedPlate}</div>
                    <button onClick={() => setDetectedPlate(null)}><X size={16}/></button>
                 </div>
               )}

               <button 
                 onClick={isParked ? handleStopParking : handleStartParking} 
                 className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 ${isParked ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
               >
                 {isParked ? 'End Session' : 'Start Parking'}
               </button>
            </section>

            <section className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 px-1">Recent Activity</h3>
              {customerHistory.map(h => (
                <div key={h.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                  <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-400"><MapPin size={20} /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{h.location}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase">{h.zone} • {new Date(h.startTime).toLocaleDateString()}</p>
                  </div>
                  <div className="font-black text-indigo-600">AED {h.cost.toFixed(2)}</div>
                </div>
              ))}
            </section>
          </div>
        )}

        {role === 'business-driver' && (
          <div className="space-y-6">
            <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
               <div className="flex justify-between items-center">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Vehicle</p>
                   <p className="text-xl font-black">{selectedVehicle.plate}</p>
                 </div>
                 <div className="p-3 bg-slate-800 rounded-2xl text-indigo-400"><Navigation size={20} /></div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => openScanner('plate')} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center gap-2 active:scale-95">
                    <Camera size={20} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Scan Plate</span>
                 </button>
                 <button onClick={() => openScanner('sign')} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center gap-2 active:scale-95">
                    <MapPin size={20} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Scan Sign</span>
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 {vehicles.map(v => (
                   <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`p-4 rounded-2xl border transition-all text-left ${selectedVehicle.id === v.id ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-800/50 text-slate-500'}`}>
                     <p className="text-xs font-black uppercase tracking-widest mb-1">{v.plate}</p>
                     <p className="text-[10px] font-medium opacity-60">{v.model}</p>
                   </button>
                 ))}
               </div>

               {detectedPlate && (
                 <div className="bg-amber-400/20 border border-amber-400/30 p-4 rounded-2xl flex items-center gap-3">
                   <Info size={18} className="text-amber-400" />
                   <p className="text-sm font-bold text-amber-200">Switching to plate: {detectedPlate}?</p>
                   <button onClick={() => setDetectedPlate(null)} className="ml-auto"><X size={16}/></button>
                 </div>
               )}

               <button onClick={isParked ? handleStopParking : handleStartParking} className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${isParked ? 'bg-rose-600' : 'bg-amber-400 text-indigo-950'}`}>
                 {isParked ? <><Receipt size={18}/> End & Notify Admin</> : <><Plus size={18}/> {detectedZone ? `Park Zone ${detectedZone}` : 'New Parking Log'}</>}
               </button>
            </section>

            {isParked && (
               <div className="bg-indigo-950 p-6 rounded-[2rem] border border-indigo-900 flex items-center gap-4 text-white shadow-lg animate-bounce">
                  <div className="bg-indigo-900 p-3 rounded-2xl text-amber-400"><Bell size={24}/></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Admin Notified</p>
                    <p className="font-bold text-sm">Session is live on FleetHQ</p>
                  </div>
               </div>
            )}
          </div>
        )}

        {role === 'business-admin' && (
          <div className="space-y-6">
            <section className="bg-amber-50 rounded-3xl p-5 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-widest mb-3">
                <Zap size={14} className="fill-amber-400 text-amber-400" />
                <h3>AI Strategic Pulse</h3>
              </div>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-2.5 bg-amber-200 rounded-full w-full"></div>
                  <div className="h-2.5 bg-amber-200 rounded-full w-3/4"></div>
                </div>
              ) : (
                <p className="text-sm text-amber-900/80 leading-relaxed font-medium">
                  {aiSuggestion || "Strategic insights will appear here as fleet data grows."}
                </p>
              )}
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><TrendingUp size={20}/></div>
                <p className="text-3xl font-black text-indigo-950">AED 1,280</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Fleet Spend</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-2">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Users size={20}/></div>
                <p className="text-3xl font-black text-indigo-950">08 / 12</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Drivers</p>
              </div>
            </div>

            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Live Activity Feed</h3>
                <button className="text-indigo-600 font-bold text-xs">Live Map</button>
              </div>
              <div className="space-y-3">
                {adminActivity.map(act => (
                  <div key={act.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-200 transition-all group">
                    <div className={`p-4 rounded-2xl ${act.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Receipt size={24}/>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-900">{act.driverName}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${act.status === 'active' ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                          {act.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Car size={10}/> {act.vehiclePlate} • {act.location}</p>
                      {act.status === 'completed' && (
                        <button className="text-[10px] font-black text-indigo-600 flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FileText size={10}/> VIEW PDF RECEIPT
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-8 py-4 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1 text-indigo-600 transition-transform active:scale-90">
          <History size={22}/>
          <span className="text-[9px] font-black uppercase tracking-tighter">Timeline</span>
        </button>
        <div className="relative -mt-16">
           <button className="w-16 h-16 bg-indigo-950 text-amber-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all hover:scale-110 active:scale-95">
              <CreditCard size={28}/>
           </button>
        </div>
        <button className="flex flex-col items-center gap-1 text-slate-400 transition-transform active:scale-90">
          <Settings size={22}/>
          <span className="text-[9px] font-black uppercase tracking-tighter">Office</span>
        </button>
      </nav>

      {/* NOTIFICATION TOAST */}
      {role === 'business-admin' && adminActivity.some(a => a.status === 'active') && (
        <div className="fixed top-24 left-4 right-4 z-[60] animate-in slide-in-from-top-6">
           <div className="bg-indigo-950 text-white p-4 rounded-[1.5rem] shadow-2xl border border-white/10 flex items-center gap-4">
              <div className="bg-amber-400 p-2 rounded-xl text-indigo-950 animate-bounce"><Bell size={20}/></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Fleet Update</p>
                <p className="text-sm font-bold">New log from {adminActivity.find(a => a.status === 'active')?.driverName}</p>
              </div>
              <button className="p-2 text-white/50 hover:text-white"><CheckCircle2 size={18}/></button>
           </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
