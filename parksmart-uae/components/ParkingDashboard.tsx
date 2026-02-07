
import React, { useState, useEffect } from 'react';
import { ParkingSession, City, ParkingType, Vehicle } from '../types';
import { triggerSMS } from '../services/smsService';

interface Props {
  session: ParkingSession | null;
  activeVehicle: Vehicle;
  onStop: () => void;
  onRenew: (mins: number) => void;
  onStart: (city: City, zone: string, type: ParkingType, duration: number) => void;
}

const ParkingDashboard: React.FC<Props> = ({ session, activeVehicle, onStop, onRenew, onStart }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const end = session.startTime + session.durationMinutes * 60 * 1000;
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setProgress(0);
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        
        const totalMs = session.durationMinutes * 60 * 1000;
        setProgress((diff / totalMs) * 100);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleSMSPayment = () => {
    if (session) {
      triggerSMS(session.city, session.zone, 60, activeVehicle);
    }
  };

  if (!session) {
    return (
      <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Vehicle is Stationary</h3>
            <p className="text-slate-400 text-sm">Detected park at <span className="font-semibold">312C</span></p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onStart(City.DUBAI, '312C', ParkingType.ZONE_A, 60)}
            className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            Pay 1 Hour
          </button>
          <button 
             onClick={() => onStart(City.DUBAI, '312C', ParkingType.ZONE_A, 120)}
            className="py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Pay 2 Hours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Active Session • {session.zone}
              </div>
              <h2 className="text-3xl font-bold">{activeVehicle.nickname}</h2>
            </div>
            <button 
              onClick={handleSMSPayment}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition-all border border-white/20"
              title="Resend SMS"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
          </div>

          <div className="mb-8 text-center">
            <div className="text-6xl font-mono font-bold tracking-tighter mb-1">{timeLeft}</div>
            <div className="text-indigo-200 text-sm font-medium">Time left in {session.city}</div>
          </div>

          <div className="w-full bg-indigo-500/30 h-2.5 rounded-full mb-8 overflow-hidden border border-white/10">
            <div 
              className={`h-full transition-all duration-1000 ${progress < 15 ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onRenew(60)}
              className="py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
               Extend 1hr
            </button>
            <button 
              onClick={onStop}
              className="py-4 bg-indigo-700/50 text-white font-bold rounded-2xl hover:bg-indigo-700/70 transition-all border border-white/10"
            >
               Finish
            </button>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Add Buttons Row */}
      <div className="flex gap-2">
        {[30, 60, 120, 240].map(mins => (
          <button 
            key={mins}
            onClick={() => onRenew(mins)}
            className="flex-1 py-3 px-1 bg-white border border-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          >
            +{mins >= 60 ? `${mins/60}h` : `${mins}m`}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ParkingDashboard;
