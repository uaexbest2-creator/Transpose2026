
import React from 'react';
import { Vehicle } from '../types';

interface Props {
  vehicles: Vehicle[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const VehicleSelector: React.FC<Props> = ({ vehicles, selectedId, onSelect, onAdd }) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
      {vehicles.map((v) => (
        <button
          key={v.id}
          onClick={() => onSelect(v.id)}
          className={`flex-shrink-0 w-48 p-4 rounded-2xl border-2 transition-all text-left ${
            selectedId === v.id 
              ? 'border-indigo-600 bg-white shadow-lg' 
              : 'border-slate-100 bg-slate-50 text-slate-400'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedId === v.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
            </div>
            {selectedId === v.id && (
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            )}
          </div>
          <h4 className={`font-bold text-sm mb-1 ${selectedId === v.id ? 'text-slate-900' : 'text-slate-400'}`}>{v.nickname}</h4>
          <div className="flex items-center gap-1 font-mono text-xs font-semibold tracking-wider bg-slate-100 px-2 py-1 rounded">
             <span className="text-slate-500">{v.code}</span>
             <span className="text-slate-900">{v.plate}</span>
          </div>
        </button>
      ))}
      <button 
        onClick={onAdd}
        className="flex-shrink-0 w-16 h-[104px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
    </div>
  );
};

export default VehicleSelector;
