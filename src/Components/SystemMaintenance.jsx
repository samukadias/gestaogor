import React, { useState, useEffect } from 'react';
import { Coffee, Loader2 } from 'lucide-react';
import fluxoClient from '@/api/fluxoClient';

export default function SystemMaintenance() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('system-offline', handleOffline);

        return () => {
            window.removeEventListener('system-offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        let interval;
        if (isOffline) {
            // Ping the backend every 10 seconds to check if it's back up
            interval = setInterval(async () => {
                try {
                    // Using a lightweight endpoint, like /health or forcing a generic get that returns fast
                    await fluxoClient.get('/auth/me', {
                        timeout: 5000,
                        // Prevent interceptor from firing another offline event if it fails again
                        _isPingRequest: true
                    });
                    // If it succeeds, the backend is back online!
                    setIsOffline(false);
                } catch (error) {
                    // Still offline, keep waiting. The interceptor is modified to ignore _isPingRequest
                }
            }, 10000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOffline]);

    if (!isOffline) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden text-center relative pointer-events-auto">
                {/* Decorative Top Banner */}
                <div className="h-32 bg-amber-50 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent"></div>
                    <div className="w-20 h-20 bg-white shadow-md rounded-full flex items-center justify-center z-10 animate-bounce">
                        <Coffee className="w-10 h-10 text-amber-700" />
                    </div>
                </div>

                <div className="px-8 pt-8 pb-10">
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
                        Pausa para o Café! ☕
                    </h2>
                    <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                        Parece que nosso servidor foi pegar mais uma xícara de café (ou tropeçaram no cabo dele).
                        Mas não se preocupe, os dados estão protegidos.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-center gap-4">
                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                        <span className="text-slate-700 font-medium whitespace-nowrap">
                            Aguarde... tentando reconectar ao servidor
                        </span>
                    </div>
                </div>

                {/* Visual loading bar at the bottom to indicate activity */}
                <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
                    <div className="w-full h-full bg-amber-500 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" style={{ transformOrigin: 'left', animationName: 'progress-bar' }}></div>
                </div>
            </div>
            <style jsx>{`
                @keyframes progress-bar {
                    0% { transform: scaleX(0); opacity: 0.5; }
                    50% { transform: scaleX(1); opacity: 1; }
                    100% { transform: scaleX(0); opacity: 0.5; transform-origin: right; }
                }
            `}</style>
        </div>
    );
}
