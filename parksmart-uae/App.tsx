
import React, { useState, useEffect, useRef } from 'react';
import { City, ParkingType, Vehicle, ParkingSession, AppNotification } from './types';
import ParkingDashboard from './components/ParkingDashboard';
import ZoneScanner from './components/ZoneScanner';
import NotificationOverlay from './components/NotificationOverlay';
import VehicleSelector from './components/VehicleSelector';
import { getParkingAdvice, detectParkingZone } from './services/geminiService';
import { triggerSMS } from './services/smsService';

const App: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', nickname: 'White Tesla', plate: '12345', code: 'A', emirate: City.DUBAI, isDefault: true, color: '#f8fafc' },
    { id: '2', nickname: 'Family SUV', plate: '99881', code: '50', emirate: City.ABU_DHABI, isDefault: false, color: '#1e293b' }
  ]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('1');
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
  const [currentUrgentNotif, setCurrentUrgentNotif] = useState<AppNotification | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Logic: Initial Parking Detection (Simulated)
  useEffect(() => {
    // In a real app, this would be triggered by motion activity or geofence
    const timer = setTimeout(() => {
      if (!activeSession) {
        triggerNotification({
          id: 'parked-detect',
          title: "Parked?",
          message: `It looks like you've stopped at Zone 312C. Would you like to pay for parking for the ${activeVehicle.nickname}?`,
          type: 'info',
          timestamp: Date.now(),
          actionLabel: "Pay Now",
          onAction: () => handleStartParking(City.DUBAI, '312C', ParkingType.ZONE_A, 60)
        });
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeSession, activeVehicle.nickname]);

  // Monitor active session for tiered notifications
  useEffect(() => {
    if (!activeSession) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const end = activeSession.startTime + activeSession.durationMinutes * 60 * 1000;
      const timeLeftMs = end - now;

      // 10 minutes warning
      if (timeLeftMs > 590000 && timeLeftMs < 600000) {
        triggerNotification({
          id: 'expiring-10',
          title: "Time Sensitive",
          message: "Parking in " + activeSession.zone + " expires in 10 minutes.",
          type: 'warning',
          timestamp: Date.now()
        });
      }

      // 2 minutes critical warning
      if (timeLeftMs > 110000 && timeLeftMs < 120000) {
        triggerNotification({
          id: 'expiring-2',
          title: "Expiring Immediately",
          message: "Only 2 minutes left! Renew now to avoid a fine in " + activeSession.city + ".",
          type: 'urgent',
          timestamp: Date.now()
        });
      }

      // Expiry
      if (timeLeftMs <= 0) {
        triggerNotification({
          id: 'expired-final',
          title: "PARKING EXPIRED",
          message: "Your session has ended. Renew immediately to avoid the AED 200+ fine!",
          type: 'urgent',
          timestamp: Date.now()
        });
        clearInterval(checkInterval);
      }
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [activeSession]);

  const triggerNotification = (notif: AppNotification) => {
    setCurrentUrgentNotif(notif);
  };

  const handleStartParking = (city: City, zone: string, type: ParkingType, duration: number) => {
    // 1. Trigger the actual SMS
    triggerSMS(city, zone, duration, activeVehicle);

    // 2. Start session in app
    const newSession: ParkingSession = {
      id: Math.random().toString(),
      city,
      zone,
      startTime: Date.now(),
      durationMinutes: duration,
      type,
      vehicleId: activeVehicle.id,
      smsSent: true
    };
    setActiveSession(newSession);
    setCurrentUrgentNotif(null);
  };

  const handleRenew = (additionalMins: number) => {
    if (!activeSession) return;
    
    // Trigger SMS for extension
    triggerSMS(activeSession.city, activeSession.zone, additionalMins, activeVehicle);

    setActiveSession({
      ...activeSession,
      durationMinutes: activeSession.durationMinutes + additionalMins
    });
    setCurrentUrgentNotif(null);
  };

  const askAiRules = async () => {
    setIsAiLoading(true);
    try {
      const result = await getParkingAdvice("Current parking holiday rules in Dubai and Abu Dhabi");
      setAiResponse(result.text);
    } catch (e) {
      setAiResponse("Usually parking is free on Sundays and Public Holidays. Check RTA/Mawaqif Twitter for live updates.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <NotificationOverlay 
        notification={currentUrgentNotif} 
        onClose={() => setCurrentUrgentNotif(null)}
        onRenew={() => handleRenew(60)}
      />

      <header className="bg-white px-6 pt-8 pb-6 sticky top-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Park<span className="text-indigo-600">Smart</span></h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">United Arab Emirates</p>
            </div>
            <div className="flex gap-3">
              <button className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </button>
            </div>
          </div>

          <VehicleSelector 
            vehicles={vehicles} 
            selectedId={selectedVehicleId} 
            onSelect={setSelectedVehicleId}
            onAdd={() => alert("Add Vehicle Flow")}
          />
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-6 space-y-8">
        <ParkingDashboard 
          session={activeSession} 
          activeVehicle={activeVehicle}
          onStop={() => setActiveSession(null)}
          onRenew={handleRenew}
          onStart={handleStartParking}
        />

        <ZoneScanner onZoneDetected={handleStartParking} />

        <section className="bg-white p-6 rounded-3xl border border-slate-100">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">UAE Parking Guide</h3>
           </div>
           {aiResponse && (
             <div className="mb-4 p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed border border-slate-100">
                {aiResponse}
             </div>
           )}
           <button 
             onClick={askAiRules}
             disabled={isAiLoading}
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50"
           >
             {isAiLoading ? "Searching Rules..." : "Check Free Parking Days"}
           </button>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-40">
        <button className="flex flex-col items-center gap-1 text-indigo-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
        </button>
        <div className="relative -top-8">
           <button className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 border-4 border-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
           </button>
        </div>
        <button className="flex flex-col items-center gap-1 text-slate-400">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Vehicles</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
