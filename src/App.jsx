import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Demands = lazy(() => import("./pages/Demands"));
const DemandDetail = lazy(() => import("./pages/DemandDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const FinanceiroHome = lazy(() => import("./pages/Financeiro"));
const Contracts = lazy(() => import("./pages/Financeiro/Contracts"));
const AttestationHistory = lazy(() => import("./pages/Financeiro/AttestationHistory"));

const PrazosDashboard = lazy(() => import("./pages/Prazos/Dashboard"));
const NewContractLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/NewContract"));
const EditContractLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/EditContract"));
const ContractsLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/Contracts"));
const ViewContractLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/ViewContract"));
const AnalysisLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/Analysis"));
const StageControlLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/StageControl"));
const DataManagementLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/DataManagement"));
const SearchLegacy = lazy(() => import("./pages/Prazos/Legacy/pages/Search"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const GerencialDashboard = lazy(() => import("./Pages/Gerencial/GerencialDashboard"));
const SystemMonitor = lazy(() => import('./pages/SystemMonitor'));

// Components
import UserNotRegisteredError from "./components/UserNotRegisteredError";
import Layout from "./components/Layout";
import { ReloadPrompt } from "./components/ReloadPrompt";
import SystemMaintenance from "./components/SystemMaintenance";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos de cache
            refetchOnWindowFocus: false, // não refetch ao voltar pra aba
            retry: 1
        },
    },
});

// Protected Route Wrapper - Now consumes useAuth
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="p-10 text-center">Carregando...</div>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
};

// Componente interno para acesso ao contexto de auth nas rotas
function AppRoutes() {
    const { user, login, logout, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Carregando aplicação...</div>;

    const getHomeRoute = (user) => {
        if (!user) return "/login";
        if (user.role === 'requester') return "/dashboard";

        const modules = user.allowed_modules || ['flow'];

        if (modules.includes('flow')) return "/dashboard";
        if (modules.includes('finance')) return "/financeiro";
        if (modules.includes('contracts')) return "/prazos";

        // Fallback baseado em departamento se modules estiver vazio
        if (user.department === 'COCR') return "/prazos";
        if (user.department === 'CVAC') return "/financeiro";
        if (user.department === 'CDPC') return "/dashboard";

        return "/dashboard"; // Fallback final
    };

    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 flex-col gap-4">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Carregando módulo...</p>
            </div>
        }>
            <Routes>
                <Route path="/login" element={
                    user ? <Navigate to={getHomeRoute(user)} replace /> : <Login onLogin={() => { }} />
                } />

                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout onLogout={logout} user={user} />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to={getHomeRoute(user)} replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="gerencial" element={<GerencialDashboard />} />
                    <Route path="admin/monitor" element={<SystemMonitor />} />
                    <Route path="demands" element={<Demands />} />
                    <Route path="demand-detail" element={<DemandDetail />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="atividades" element={<ActivityLog />} />
                    {/* Módulo Financeiro */}
                    <Route path="financeiro">
                        <Route index element={<FinanceiroHome />} />
                        <Route path="dashboard" element={<FinanceiroHome />} />
                        <Route path="contratos" element={<Contracts />} />
                        <Route path="contratos/:contractId/atestacoes" element={<AttestationHistory />} />

                    </Route>
                    <Route path="prazos">
                        <Route index element={<PrazosDashboard />} />
                        <Route path="contratos" element={<ContractsLegacy />} />
                        <Route path="ver" element={<ViewContractLegacy />} />
                        <Route path="analise" element={<AnalysisLegacy />} />
                        <Route path="etapas" element={<StageControlLegacy />} />
                        <Route path="gestao-dados" element={<DataManagementLegacy />} />
                        <Route path="pesquisa" element={<SearchLegacy />} />
                        <Route path="contratos/novo" element={<NewContractLegacy />} />
                        <Route path="contratos/editar/:id" element={<EditContractLegacy />} />
                        {/* Rotas legadas antigas para compatibilidade se existirem links */}
                        <Route path="novo" element={<NewContractLegacy />} />
                        <Route path="editar/:id" element={<EditContractLegacy />} />
                    </Route>

                </Route>

                <Route path="/access-denied" element={<UserNotRegisteredError />} />
                <Route path="*" element={<Navigate to={user ? getHomeRoute(user) : "/login"} replace />} />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
                <Toaster />
                <ReloadPrompt />
                <SystemMaintenance />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;
