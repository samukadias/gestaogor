import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
    "PENDENTE TRIAGEM": "#f59e0b",
    "TRIAGEM NÃO ELEGÍVEL": "#94a3b8",
    "DESIGNADA": "#3b82f6",
    "EM QUALIFICAÇÃO": "#8b5cf6",
    "EM ANDAMENTO": "#6366f1",
    "PENDÊNCIA DDS": "#f97316",
    "PENDÊNCIA DOP": "#f97316",
    "PENDÊNCIA DOP E DDS": "#f97316",
    "PENDÊNCIA COMERCIAL": "#f43f5e",
    "PENDÊNCIA SUPRIMENTOS": "#14b8a6",
    "PENDÊNCIA FORNECEDOR": "#ef4444",
    "CONGELADA": "#06b6d4",
    "ENTREGUE": "#10b981",
    "CANCELADA": "#71717a"
};

function formatDuration(minutes) {
    if (!minutes || minutes < 0) return '0h';

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.round(hours / 24);
    return `${days}d`;
}

function BottleneckBarChart({ data = [], onBarClick }) {
    const chartData = data
        .filter(d => d.total_minutes > 0)
        .sort((a, b) => b.total_minutes - a.total_minutes)
        .slice(0, 10);

    const totalMinutes = chartData.reduce((sum, d) => sum + d.total_minutes, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const percentage = totalMinutes > 0 ? ((item.total_minutes / totalMinutes) * 100).toFixed(1) : 0;

            return (
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.status}</p>
                    <p className="text-xs text-slate-600">
                        Tempo Total: <span className="font-medium">{formatDuration(item.total_minutes)}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                        Percentual: <span className="font-medium">{percentage}%</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {item.count} ocorrência(s)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        // Show empty chart structure with message
        const emptyData = Array(5).fill(null).map((_, i) => ({
            status: `Status ${i + 1}`,
            total_minutes: 0,
            count: 0
        }));

        return (
            <div className="relative w-full h-[300px]">
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="text-center p-4 bg-white/90 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500">Sem dados de histórico disponíveis</p>
                        <p className="text-xs text-slate-400 mt-1">O gráfico aparecerá aqui quando houver movimentações.</p>
                    </div>
                </div>
                <div className="opacity-30 blur-[1px] pointer-events-none">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={emptyData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="status" width={110} tick={{ fill: '#cbd5e1' }} />
                            <Bar dataKey="total_minutes" fill="#e2e8f0" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                    type="number"
                    tickFormatter={(v) => formatDuration(v)}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                    type="category"
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_minutes" radius={[0, 4, 4, 0]} cursor={onBarClick ? 'pointer' : 'default'} onClick={(data) => onBarClick && onBarClick(data.status)}>
                    {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default React.memo(BottleneckBarChart);
