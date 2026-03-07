import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
    'Baixa': '#10b981',
    'Média': '#f59e0b',
    'Alta': '#ef4444'
};

function ComplexityChart({ data = [] }) {
    const chartData = Object.entries(data).map(([complexity, avgDays]) => ({
        complexity,
        days: Math.round(avgDays * 10) / 10
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-800 text-sm mb-1">
                        Complexidade {item.complexity}
                    </p>
                    <p className="text-xs text-slate-600">
                        Tempo Médio: <span className="font-medium">{item.days} dias úteis</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        // Show empty structure
        const emptyData = [
            { complexity: 'Baixa', days: 0 },
            { complexity: 'Média', days: 0 },
            { complexity: 'Alta', days: 0 }
        ];

        return (
            <div className="relative w-full h-[200px]">
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="text-center p-4 bg-white/90 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500">Sem dados de conclusão</p>
                        <p className="text-xs text-slate-400 mt-1">Necessário demandas entregues para cálculo.</p>
                    </div>
                </div>
                <div className="opacity-30 blur-[1px] pointer-events-none">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={emptyData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="complexity" tick={{ fontSize: 12, fill: '#cbd5e1' }} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis tick={false} axisLine={{ stroke: '#e2e8f0' }} />
                            <Bar dataKey="days" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                    dataKey="complexity"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(v) => `${v}d`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.complexity] || '#94a3b8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default React.memo(ComplexityChart);
