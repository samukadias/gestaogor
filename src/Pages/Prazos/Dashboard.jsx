import React, { useState, useEffect } from 'react';
import Dashboard from './Legacy/pages/Dashboard';
import ClientDashboard from './ClientDashboard';
import { useAuth } from "@/context/AuthContext";

const PrazosDashboard = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

    // Se for CLIENTE CDPC, mostra o dash específico
    if (user?.role === 'client') {
        return <ClientDashboard />;
    }

    // Default legacy dashboard for everyone else
    return (
        <div className="bg-gray-50 min-h-screen">
            <Dashboard />
        </div>
    );
};

export default PrazosDashboard;
