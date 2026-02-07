
import React, { useState, useRef } from 'react';
import { detectParkingZone } from '../services/geminiService';
import { City, ParkingType } from '../types';

interface Props {
  onZoneDetected: (city: City, zone: string, type: ParkingType) => void;
}

const ZoneScanner: React.FC<Props> = ({ onZoneDetected }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      try {
        const result = await detectParkingZone(base64Data);
        // Map string from AI to enum
        const cityMap: Record<string, City> = {
          'Dubai': City.DUBAI,
          'Abu Dhabi': City.ABU_DHABI,
          'Sharjah': City.SHARJAH,
          'Ajman': City.AJMAN
        };
        
        onZoneDetected(
          cityMap[result.city] || City.DUBAI,
          result.zoneCode,
          result.type as ParkingType || ParkingType.STANDARD
        );
      } catch (err) {
        setError("Could not identify the parking zone. Please try again or enter manually.");
        console.error(err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Sign Scanner</h3>
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md font-semibold">AI POWERED</span>
      </div>
      
      <p className="text-slate-500 text-sm mb-6">
        Take a photo of the RTA or Mawaqif parking sign to automatically identify the zone and rules.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all border-2 ${isScanning ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50'}`}
      >
        {isScanning ? (
          <>
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Analyzing sign...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Scan Parking Sign
          </>
        )}
      </button>
    </div>
  );
};

export default ZoneScanner;
