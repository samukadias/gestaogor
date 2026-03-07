import React, { useState, useEffect } from 'react';
import ManagerDashboard from './ManagerDashboard';
import RequesterDashboard from './RequesterDashboard';
import { Loader2 } from "lucide-react";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('fluxo_user') || localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (user?.role === 'requester') {
        return <RequesterDashboard />;
    }

    // Default to Manager/Analyst Dashboard
    return <ManagerDashboard />;
}
