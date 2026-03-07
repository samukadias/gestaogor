import React, { useState, useEffect } from 'react';
import ManagerDashboard from './ManagerDashboard';
import RequesterDashboard from './RequesterDashboard';

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
        return <div className="p-10 text-center">Carregando...</div>;
    }

    if (user?.role === 'requester') {
        return <RequesterDashboard />;
    }

    // Default to Manager/Analyst Dashboard
    return <ManagerDashboard />;
}
