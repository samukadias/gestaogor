import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import ManagerDashboard from './Dashboard';
import AnalystDashboard from './AnalystDashboard';
import { Loader2 } from 'lucide-react';

export default function FinanceiroHome() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('fluxo_user') || localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Erro ao carregar usuário:', e);
        }
        setLoading(false);
    }, []);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const isManager = user?.role === 'manager' || user?.profile_type === 'gestor' || user?.department === 'GOR' || (user?.department === 'CVAC' && user?.role === 'manager');
    const isAnalyst = user?.department === 'CVAC' && (user?.role === 'analyst' || user?.profile_type === 'analista');

    if (isManager) {
        return <ManagerDashboard />;
    }

    if (isAnalyst) {
        return <AnalystDashboard />;
    }

    // Se não for gestor nem analista CVAC, mas tiver acesso ao módulo, redireciona para Contratos por segurança
    return <Navigate to="/financeiro/contratos" replace />;
}
