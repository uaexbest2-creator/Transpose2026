
import React from 'react';
import { AppNotification } from '../types';

interface Props {
  notification: AppNotification | null;
  onClose: () => void;
  onRenew?: () => void;
}

const NotificationOverlay: React.FC<Props> = ({ notification, onClose, onRenew }) => {
  if (!notification) return null;

  const isUrgent = notification.type === 'urgent';
  const isInfo = notification.type === 'info';
  const isWarning = notification.type === 'warning';

  let borderColor = 'border-indigo-500';
  let bgColor = 'bg-white';
  let badgeClass = 'bg-indigo-500 text-white';

  if (isUrgent) {
    borderColor = 'border-red-500 unmissable-pulse';
    badgeClass = 'bg-red-500 text-white';
  } else if (isWarning) {
    borderColor = 'border-amber-500';
    badgeClass = 'bg-amber-500 text-white';
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
      <div className={`w-full max-w-sm bg-white rounded-[40px] overflow-hidden shadow-2xl transform transition-all duration-500 scale-100 border-[6px] ${borderColor}`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${badgeClass}`}>
              {notification.title}
            </span>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:text-slate-600 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <p className="text-slate-900 text-2xl font-bold leading-tight mb-8">
            {notification.message}
          </p>
          
          <div className="flex flex-col gap-3">
            {notification.onAction ? (
              <button 
                onClick={() => {
                   notification.onAction?.();
                   onClose();
                }}
                className={`w-full py-5 text-white font-black rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 ${isUrgent ? 'bg-red-600' : 'bg-indigo-600'}`}
              >
                {notification.actionLabel || 'Accept'}
              </button>
            ) : isUrgent || isWarning ? (
              <button 
                onClick={onRenew}
                className={`w-full py-5 text-white font-black rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 ${isUrgent ? 'bg-red-600 shadow-red-200' : 'bg-indigo-600 shadow-indigo-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Extend 1 Hour
              </button>
            ) : null}
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-3xl transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationOverlay;
