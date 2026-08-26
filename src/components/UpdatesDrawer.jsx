import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import LogoMark from './LogoMark';

export default function UpdatesDrawer({ isOpen, onClose }) {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchUpdates = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch('/api/brand-updates');
        const data = await res.json();
        if (data && data.success) {
          setUpdates(data.updates || []);
        } else {
          setErrorMsg(data.message || 'Failed to fetch updates.');
        }
      } catch (err) {
        console.error('Error fetching brand updates:', err);
        setErrorMsg('Network error. Failed to load updates.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, [isOpen]);




  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 z-50"
        />
      )}

      {/* Sliding Drawer Panel (from Left) */}
      <div
        className={`fixed left-0 top-0 h-full w-[22rem] sm:w-[26rem] z-50 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col border-r border-black/10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center border-b border-black/10 p-6">
          <div className="flex items-center space-x-3">
            <LogoMark className="w-8 h-8 text-black fill-black" />
            <span className="font-cinzel font-black text-xl tracking-[0.25em] text-black">KHRONIQ</span>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:scale-110 transition p-1 hover:bg-black/5 rounded-full cursor-pointer"
          >
            <X size={18} className="stroke-[3]" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-black/20">
          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded text-[10px] uppercase font-black tracking-wider animate-pulse">
              {errorMsg}
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-3 border-black"></div>
              <p className="text-[10px] text-black font-black uppercase tracking-widest mt-3">Loading updates...</p>
            </div>
          )}

          {!loading && !errorMsg && updates.length === 0 && (
            <div className="text-center py-12 text-black font-black uppercase tracking-wider text-xs">
              No updates available at the moment.
            </div>
          )}

          {!loading && !errorMsg && updates.length > 0 && (
            <ul className="space-y-6">
              {updates.map((item, idx) => (
                <li
                  key={item._id || idx}
                  className="flex items-start gap-3 p-4 bg-white/45 backdrop-blur-sm rounded-lg border border-white/40 hover:bg-white/60 transition-colors duration-300 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-black mt-1.5 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-sm font-black uppercase text-black tracking-wider">
                      {item.title}
                    </h4>
                    <p className="text-neutral-950 text-xs font-bold leading-relaxed whitespace-pre-line">
                      {item.detail}
                    </p>
                    {item.createdAt && (
                      <p className="text-[9px] text-neutral-900 font-extrabold tracking-wider uppercase pt-1">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
