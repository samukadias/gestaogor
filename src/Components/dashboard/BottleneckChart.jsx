import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

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

function BottleneckChart({ data = [] }) {
    // Enrich data with Average Time
    const chartData = data
        .filter(d => d.total_minutes > 0)
        .map(d => ({
            ...d,
            avg_minutes: Math.round(d.total_minutes / d.count),
            // We use total_minutes for bubble size (Z axis) importance
            importance: d.total_minutes
        }))
        .sort((a, b) => b.total_minutes - a.total_minutes);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                        />
                        <p className="font-semibold text-slate-800 text-sm leading-tight">
                            {item.status}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Quantidade:</span>
                            <span className="font-medium bg-slate-100 px-1.5 rounded text-slate-800">
                                {item.count} dmds
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Tempo Médio:</span>
                            <span className="font-medium bg-indigo-50 px-1.5 rounded text-indigo-700">
                                {formatDuration(item.avg_minutes)}
                            </span>
                        </div>
                        <div className="border-t border-slate-100 my-1 pt-1 flex justify-between text-xs text-slate-500">
                            <span>Impacto Total:</span>
                            <span className="font-medium">
                                {formatDuration(item.total_minutes)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className="relative w-full h-[300px]">
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <div className="text-center p-4 bg-white/90 rounded-lg shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500">Sem dados de histórico</p>
                        <p className="text-xs text-slate-400 mt-1">O gráfico de dispersão aparecerá aqui.</p>
                    </div>
                </div>
                {/* Visual placeholder axis */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate-200 tracking-wider pointer-events-none">
                    LENTIDÃO (TEMPO MÉDIO)
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-200 tracking-wider pointer-events-none">
                    VOLUME (QUANTIDADE)
                </div>
                <div className="opacity-30 blur-[1px] pointer-events-none h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" dataKey="x" tick={{ fill: '#cbd5e1' }} axisLine={{ stroke: '#e2e8f0' }} />
                            <YAxis type="number" dataKey="y" tick={{ fill: '#cbd5e1' }} axisLine={{ stroke: '#e2e8f0' }} />
                            <Scatter name="Placeholder" data={[{ x: 0, y: 0 }]} fill="#e2e8f0" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full relative">
            {/* Axis Labels */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-slate-400 tracking-wider pointer-events-none">
                LENTIDÃO (TEMPO MÉDIO)
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 tracking-wider pointer-events-none">
                VOLUME (QUANTIDADE)
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        dataKey="count"
                        name="Volume"
                        unit=""
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                        type="number"
                        dataKey="avg_minutes"
                        name="Tempo Médio"
                        unit="min"
                        tickFormatter={(v) => formatDuration(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <ZAxis
                        type="number"
                        dataKey="importance"
                        range={[100, 1000]}
                        name="Tempo Total"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Demandas" data={chartData}>
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                                fillOpacity={0.8}
                                stroke={STATUS_COLORS[entry.status] || '#94a3b8'}
                                strokeWidth={2}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

export default React.memo(BottleneckChart);
