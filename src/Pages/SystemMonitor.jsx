import React, { useState, useEffect, useCallback } from 'react';
import { fluxClient } from '@/api/fluxoClient';
import {
    Cpu, MemoryStick, Users, Clock, Server,
    RefreshCw, Wifi, WifiOff, Activity
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function ProgressBar({ value, colorClass = 'bg-blue-500' }) {
    return (
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
                className={`h-2 rounded-full transition-all duration-700 ${colorClass}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    );
}

function StatCard({ title, icon: Icon, iconBg, children }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${iconBg}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </div>
    );
}

const DEPT_COLORS = {
    CDPC: 'bg-blue-100 text-blue-700',
    COCR: 'bg-indigo-100 text-indigo-700',
    CVAC: 'bg-emerald-100 text-emerald-700',
    GOR: 'bg-purple-100 text-purple-700',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function SystemMonitor() {
    const [stats, setStats] = useState(null);
    const [online, setOnline] = useState({ count: 0, users: [] });
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const [sysData, onlineData] = await Promise.all([
                fluxClient.get('/admin/system-stats').then(r => r.data),
                fluxClient.get('/admin/users/online').then(r => r.data),
            ]);
            setStats(sysData);
            setOnline(onlineData);
            setLastRefresh(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err) {
            console.error('SystemMonitor fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + auto-refresh every 5s
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchStats]);

    const cpuColor = !stats ? 'bg-blue-500'
        : stats.cpu.percent > 80 ? 'bg-rose-500'
            : stats.cpu.percent > 50 ? 'bg-amber-500'
                : 'bg-emerald-500';

    const memColor = !stats ? 'bg-blue-500'
        : stats.memory.usedPercent > 85 ? 'bg-rose-500'
            : stats.memory.usedPercent > 65 ? 'bg-amber-500'
                : 'bg-emerald-500';

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Server className="w-7 h-7 text-slate-600" />
                        Monitor do Sistema
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Métricas em tempo real do servidor de aplicação
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-xs text-slate-400 font-mono">
                            Atualizado: {lastRefresh}
                        </span>
                    )}
                    <button
                        onClick={() => setAutoRefresh(a => !a)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${autoRefresh
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                    >
                        {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        {autoRefresh ? 'Ao vivo' : 'Pausado'}
                    </button>
                    <button
                        onClick={fetchStats}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* System Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* CPU */}
                <StatCard title="CPU (Processo Node)" icon={Cpu} iconBg="bg-blue-50 text-blue-600">
                    {!stats ? (
                        <p className="text-slate-400 text-sm">Carregando...</p>
                    ) : (
                        <>
                            <div className="flex items-end gap-2">
                                <p className={`text-4xl font-black ${stats.cpu.percent > 80 ? 'text-rose-600' : stats.cpu.percent > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {stats.cpu.percent}%
                                </p>
                                <p className="text-xs text-slate-400 pb-1.5">{stats.cpu.cores} núcleos</p>
                            </div>
                            <ProgressBar value={stats.cpu.percent} colorClass={cpuColor} />
                            <p className="text-[10px] text-slate-400 truncate" title={stats.cpu.model}>{stats.cpu.model}</p>
                        </>
                    )}
                </StatCard>

                {/* Memory */}
                <StatCard title="Memória (Servidor)" icon={MemoryStick} iconBg="bg-purple-50 text-purple-600">
                    {!stats ? (
                        <p className="text-slate-400 text-sm">Carregando...</p>
                    ) : (
                        <>
                            <div className="flex items-end gap-2">
                                <p className={`text-4xl font-black ${stats.memory.usedPercent > 85 ? 'text-rose-600' : stats.memory.usedPercent > 65 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {stats.memory.usedPercent}%
                                </p>
                                <p className="text-xs text-slate-400 pb-1.5">
                                    {stats.memory.freeMb}MB livre de {stats.memory.totalMb}MB
                                </p>
                            </div>
                            <ProgressBar value={stats.memory.usedPercent} colorClass={memColor} />
                            <div className="flex gap-3 text-xs text-slate-500">
                                <span>Heap: <b className="text-slate-700">{stats.memory.heapUsedMb}MB / {stats.memory.heapTotalMb}MB</b></span>
                                <span>RSS: <b className="text-slate-700">{stats.memory.rssMb}MB</b></span>
                            </div>
                        </>
                    )}
                </StatCard>

                {/* Uptime */}
                <StatCard title="Disponibilidade" icon={Clock} iconBg="bg-emerald-50 text-emerald-600">
                    {!stats ? (
                        <p className="text-slate-400 text-sm">Carregando...</p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Processo Node</p>
                                <p className="text-2xl font-black text-slate-800">{fmtUptime(stats.uptime.processSeconds)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs text-slate-500">
                                <div className="flex justify-between">
                                    <span>Servidor (OS)</span>
                                    <b className="text-slate-700">{fmtUptime(stats.uptime.osSeconds)}</b>
                                </div>
                                <div className="flex justify-between">
                                    <span>Plataforma</span>
                                    <b className="text-slate-700">{stats.platform}</b>
                                </div>
                                <div className="flex justify-between">
                                    <span>Node.js</span>
                                    <b className="text-slate-700">{stats.nodeVersion}</b>
                                </div>
                            </div>
                        </>
                    )}
                </StatCard>
            </div>

            {/* Online Users */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700">Usuários Online</h3>
                            <p className="text-xs text-slate-400">Ativos nos últimos 2 minutos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-2xl font-black text-slate-800">{online.count}</span>
                        <span className="text-sm text-slate-400">online</span>
                    </div>
                </div>

                {online.users.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Nenhum usuário com atividade recente detectada.<br />
                        <span className="text-xs">O heartbeat atualiza a cada 60 segundos.</span>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {online.users.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center uppercase">
                                        {u.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.department && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${DEPT_COLORS[u.department] || 'bg-slate-100 text-slate-600'}`}>
                                            {u.department}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                                        {u.role}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
